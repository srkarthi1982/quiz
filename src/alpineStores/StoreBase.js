import { getPaginatedResult, remove, save } from "../common/database";
import { copyToClipboard, debounce, getTakeValue, getScreenSize, ddmmyyyy } from "../common/utils";
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
        const result = await getPaginatedResult(this.title, this.schema, this.view, this.fields, this.filters, this.columns, this.pagination, this.sorting);
        const { success, data, count, pageValues } = result;
        if (!success) return;
        this.items = data || [];
        this.total = count;
        this.pageValues = pageValues;
    }
    async onDelete({ id, name }) {
        const result = await remove(id, this.short, this.schema, this.table, name);
        if (result) this.getData();
    }
    openDrawer(item) {
        this.showAction = false;
        this.item = item;
        this.showDrawer = true;
    }
    async closeDrawer(id, params) {
        const result = await save(id, this.short, this.schema, this.table, params);
        if (!result) return;
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