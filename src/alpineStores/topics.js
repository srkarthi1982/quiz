import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
const item = { id: 0, name: '', is_active: true };
const filters = { name: '', is_active: '' };
const sorting = { sort: 'name', order: true };
const fields = "id, name, is_active";
const columns = [
    { label: 'Name', value: "name", operator: 'ilike' },
    { label: 'Active', value: "is_active", operator: 'eq' }
];
class Topics extends StoreBase {
    constructor() {
        super('public', 'Topics', 'Topic', 'topics', 'topics', item, filters, sorting, fields, columns);
    }
    onInit(location) {
        const filterParams = { is_active: location.pathname.includes('management') ? '' : true };
        this.filters = { ...filters, ...filterParams };
        this.sorting = { ...sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        const { id, name, is_active } = this.item;
        await this.closeDrawer(id, { name, is_active });
    }
    onInsert() { this.openDrawer({ ...item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('topics', new Topics());