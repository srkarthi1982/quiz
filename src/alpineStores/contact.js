import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { getResult } from '../common/database';
const item = { id: 0, name: '', email: '', phone: '', detail: '', status_id: '', created_at: '' };
const filters = { name: '', email: '', phone: '', detail: '', status_id: '', created_at: '' };
const sorting = { sort: 'name', order: true };
const fields = "id, name, email, phone, detail, created_at, status_id, status_name";
const columns = [
    { label: 'Name', value: "name", operator: 'ilike' },
    { label: 'Email', value: "email", operator: 'ilike' },
    { label: 'Phone', value: "phone", operator: 'ilike' },
    { label: 'Detail', value: "detail", operator: 'ilike' },
    { label: 'Status', value: "status_id", operator: 'eq' },
    { label: 'Created At', value: "created_at", operator: 'eq' }
];
const list = { statusList: [] };
class Contact extends StoreBase {
    constructor() {
        super('public', 'Contact', 'Contact', 'vw_contact', 'contact', item, filters, sorting, fields, columns);
        this.column = { ...list };
        this.form = { ...list };
    }
    onInit() {
        this.filters = { ...filters };
        this.sorting = { ...sorting };
        this.pagination = { ...this.defaultPagination };
        this.getStatusList();
        this.getData();
    }
    async getStatusList() {
        const { success, data } = await getResult(this.schema, 'status', 'id, name', { is_active: true }, 'name');
        if (!success) return;
        this.column.statusList = data;
        this.form.statusList = data;
    }
    async onSave() {
        const { id, name, email, phone, detail, status_id } = this.item;
        await this.closeDrawer(id, { name, email, phone, detail, status_id });
    }
    onInsert() { this.openDrawer({ ...item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('contact', new Contact());