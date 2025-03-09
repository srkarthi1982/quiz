import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { getResult } from '../common/database';
import { url } from '../lib/data';
const item = { id: '', name: '', email: '', phone: '', role_id: '', country_id: '', state_id: '', city_id: '' };
const filters = { name: '', email: '', phone: '', role_id: '', country_id: '', state_id: '', city_id: '', created_at: '' };
const sorting = { sort: 'name', order: true };
const fields = "id, name, email, phone, role_id, role_name, country_id, country_name, state_id, state_name, city_id, city_name, created_at";
const columns = [
    { label: 'User Name', value: "name", operator: 'ilike' },
    { label: 'Email', value: "email", operator: 'ilike' },
    { label: 'Phone', value: "phone", operator: 'ilike' },
    { label: 'Role', value: "role_id", operator: 'eq' },
    { label: 'Country', value: "country_id", operator: 'eq' },
    { label: 'State', value: "state_id", operator: 'eq' },
    { label: 'City', value: "city_id", operator: 'eq' },
    { label: 'Created At', value: "created_at", operator: 'eq' }
];
const list = { roles: [], countries: [], states: [], cities: [] };
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
        this.getCountries();
        this.getData();
    }
    async getRoles() {
        const match = { is_active: true };
        const { success, data } = await getResult(this.schema, 'roles', 'id, name', match, 'name');
        if (!success) return;
        this.column.roles = data;
        this.form.roles = data;
    }
    async getCountries() {
        const match = { is_active: true, 'states.is_active': true, 'states.cities.is_active': true };
        const { success, data } = await getResult(this.schema, 'countries', 'id, name, states(id, name, cities(id, name))', match, 'name');
        if (!success) return;
        this.column.countries = data;
        this.form.countries = data;
    }
    async onDelete({ id, name }) {
        if (!confirm(`Are you sure? you want to delete this User: '${name}'? `)) return false;
        Alpine.store("loader").hide();
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
        const { id, name, email, phone, role_id, country_id, state_id, city_id } = this.item;
        const itemToSubmit = { id, name, email, phone, role_id, country_id, state_id, city_id };
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
        this.form.states = item.country_id ? this.form.countries.find(x => x.id === item.country_id)?.states : [];
        this.form.cities = item.city_id ? this.form.states.find(x => x.id === item.state_id)?.cities : [];
        this.openDrawer({ ...item });
    }
    onColumnCountryChange(country_id) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.country_id = country_id;
        this.filters.state_id = '';
        this.filters.city_id = '';
        this.column.states = country_id ? this.column.countries.find(x => x.id === country_id)?.states : [];
        this.column.cities = [];
        this.getData();
    }
    onColumnStateChange(state_id) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.state_id = state_id;
        this.filters.city_id = '';
        this.column.cities = state_id ? this.column.states.find(x => x.id === state_id)?.cities : [];
        this.getData();
    }
    onFormCountryChange(country_id) {
        this.item.country_id = country_id;
        this.item.state_id = '';
        this.item.city_id = '';
        this.form.states = country_id ? this.form.countries.find(x => x.id === country_id)?.states : [];
    }
    onFormStateChange(state_id) {
        this.item.state_id = state_id;
        this.item.city_id = '';
        this.form.cities = state_id ? this.form.states.find(x => x.id === state_id)?.cities : [];
    }
}
Alpine.store('users', new Users());