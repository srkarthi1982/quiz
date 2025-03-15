import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { actions } from 'astro:actions';
import { url } from '../lib/data';
const item = { id: '', name: '', email: '', role_id: '' };
const filters = { name: '', email: '', role_id: '', created_at: '' };
const sorting = { sort: 'name', order: true };
const fields = "id, name, email, role_id, role_name, created_at";
const columns = [
    { label: 'User Name', value: "name", operator: 'ilike' },
    { label: 'Email', value: "email", operator: 'ilike' },
    { label: 'Role', value: "role_id", operator: 'eq' },
    { label: 'Created At', value: "created_at", operator: 'eq' }
];
const list = { roles: [] };
class Users extends StoreBase {
    constructor() {
        super('public', 'Users', 'User', 'vw_profiles', 'profiles', item, filters, sorting, fields, columns);
        this.column = { ...list };
        this.form = { ...list };
    }
    onInit() {
        this.filters = { ...filters };
        this.sorting = { ...sorting };
        this.pagination = { ...this.defaultPagination };
        this.getRoles();
        this.getData();
    }
    async getRoles() {
        Alpine.store("loader").show();
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'roles', fields: 'id, name', match: { is_active: true }, order: 'name' });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        this.column.roles = data;
        this.form.roles = data;
    }
    async onDelete({ id, name }) {
        if (!confirm(`Are you sure? you want to delete this User: '${name}'? `)) return false;
        Alpine.store("loader").show();
        const formData = new FormData();
        formData.append("id", id);
        const response = await fetch(url('api/auth/deleteUser'), { method: 'POST', body: formData });
        const message = await response.text();
        Alpine.store("loader").hide();
        if(!response.ok){
            Alpine.store('toast').show(message.replace('AuthApiError: ', ''), 'error');
            return;
        }
        Alpine.store('toast').show(`User: '${name}' deleted successfully.`, 'success');
        this.getData();
    }
    async onSave() {
        Alpine.store("loader").show();
        const { id, name, email, role_id } = this.item;
        const itemToSubmit = { id, name, email, role_id };
        const formData = new FormData();
        Object.entries(itemToSubmit).forEach(([key, value]) => formData.append(key, value));
        const response = await fetch(url('api/auth/updateUser'), { method: 'POST', body: formData });
        const message = await response.text();
        Alpine.store("loader").hide();
        if(!response.ok){
            Alpine.store('toast').show(message.replace('AuthApiError: ', ''), 'error');
            return;
        }
        Alpine.store('toast').show(`User: '${name}' updated successfully.`, 'success');
        this.getData();
        this.showDrawer = false;
    }
    onEdit(item) { 
        this.openDrawer({ ...item });
    }
}
Alpine.store('users', new Users());