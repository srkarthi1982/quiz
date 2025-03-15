import { copyToClipboard, debounce, getTakeValue, getScreenSize, ddmmyyyy } from "../common/utils";
import { actions } from 'astro:actions';
export class StoreBase {
    constructor(schema, title, short, view, table, item, filters, sorting, fields, columns) {
        this.schema = schema;
        this.title = title;
        this.short = short;
        this.view = view;
        this.table = table;
        this.fields = fields;
        this.columns = columns;
        this.items = [];
        this.item = item;
        this.filters = filters;
        this.sorting = sorting;
        this.pagination = { ...this.defaultPagination };
        this.total = 0;
        this.showAction = false;
        this.showDrawer = false;
        this.pageValues = {
            start: 0,
            end: 0,
            pages: [],
            disableNextButton: { disabled: undefined },
            disablePreviousButton: { disabled: undefined },
            disablePager: { disabled: undefined },
        };
        this.ddmmyyyy = ddmmyyyy;
    }
    get defaultPagination() {
        return { page: 1, take: getTakeValue(getScreenSize()) };
    }
    async getData() {
        Alpine.store("loader").show();
        const { schema, view, fields, filters, columns, pagination, sorting } = this;
        const result = await actions.getPaginatedResult({ schema, view, fields, filters, columns, pagination, sorting });
        Alpine.store("loader").hide();
        const { data, error } = result;
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        this.items = data.data || [];
        this.total = data.count;
        this.pageValues = data.pageValues;
    }
    async onDelete({ id, name }) {
        const { title, schema, table } = this;
        if (!confirm(`Are you sure? you want to delete this ${title}: '${name}'? `)) return false;
        Alpine.store("loader").show();
        const { data, error } = await actions.remove({ id, schema, table });
        Alpine.store("loader").hide();
        if (error) { Alpine.store('toast').show(error.message, 'error'); return false; }
        Alpine.store('toast').show(`${title}: '${name}' deleted successfully.`, 'success');
        if (data) this.getData();
    }
    openDrawer(item) {
        this.showAction = false;
        this.item = item;
        this.showDrawer = true;
    }
    async closeDrawer(id, params) {
        Alpine.store("loader").show();
        const { short, schema, table } = this;
        const {data, error} = await actions.save({ id, title: short, schema, table, params });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        Alpine.store('toast').show(`${short}: '${params.name}' saved successfully.`, 'success');
        this.getData();
        this.showDrawer = false;
    }
    copyId(id) { copyToClipboard(id) }
    search = debounce(function (key, value) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters[key] = value;
        this.getData();
    }, 500);
    onColumnListChange(key, value) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters[key] = value;
        this.getData();
    }
    onFormListChange(key, value) {
        this.item[key] = value
    }
}