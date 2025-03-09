import { getPagerInfo } from '../common/utils';
import { supabase } from '../lib/supabase';
const pagination = { page: 1, take: 10, skip: 0 };
export default function createBaseStore(item, filters, sorting, columns, tableToSelect, tableToSave) {
    return {
        items: [],
        item,
        filters: {...filters},
        sorting: {...sorting},
        pagination: {... pagination},
        total: 0,
        isLoading: false,
        isInitital: false,
        showAction: false,
        pageValues: {
            start: 0,
            end: 0,
            pages: [],
            disableNextButton: { disabled: undefined },
            disablePreviousButton: { disabled: undefined },
            disablePager: { disabled: undefined },
        },
        showDrawer: false,
        columns,
        onReset() {
            this.showAction = false;
            this.filters = { ...filters };
            this.sorting = { ...sorting };
            this.pagination = { ...pagination };
            this.total = 0;
            this.getData();
        },
        getData() {
            this.isLoading = true;
            const { filters, columns } = this;
            const page = Number(this.pagination.page);
            const take = Number(this.pagination.take);
            const sort = this.sorting.sort;
            const order = Boolean(this.sorting.order);
            let query = supabase.from(tableToSelect).select("*", { count: "exact" });
            columns.forEach(({ value, operator }) => {
                const param = filters[value];
                if (param) {
                    if(operator === 'ilike') query.filter(value, operator, `%${param}%`);
                    if(operator === 'eq') query.filter(value, operator, param);
                }
            });
            if (sort !== null) query = query.order(sort, { ascending: order });
            query.range(((page - 1) * take), take * page - 1).then(({ data, count, error }) => {
                if (error) { 
                    this.isLoading = false;
                    alert(error.message); 
                    return; 
                };
                this.items = data || [];
                this.total = count;
                this.pageValues = getPagerInfo(data, page, take, count);
                this.isLoading = false;
            });
        },
        onInsert() {
            this.showAction = false;
            this.item = { ...item };
            this.showDrawer = true;
        },
        onEdit(selectedItem) {
            delete selectedItem.showAction;
            this.item = { ...selectedItem };
            this.showDrawer = true;
        },
        async onDelete(item) {
            this.isLoading = true;
            const confirmed = confirm(`Are you sure? you want to delete this '${item.name}'? `);
            if (confirmed) {
                const { error } = await supabase.from(tableToSave).delete().eq("id", item.id);
                if (error) { 
                    this.isLoading = false;
                    alert(error.message); 
                    return; 
                }
                this.getData();
            }
            this.isLoading = false;
        },
        async onSave() {
            this.isLoading = true;
            const { error } = this.item.id ?
                await supabase.from(tableToSave).update(this.item).eq("id", this.item.id) :
                await supabase.from(tableToSave).insert({...this.item, id: undefined});
            if (error) { 
                this.isLoading = false;
                alert(error.message); 
                return; 
            }
            this.getData();
            this.showDrawer = false;
            this.item = { ...item };
        }
    }
}