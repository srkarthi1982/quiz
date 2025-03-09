import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { getResult } from '../common/database';
const item = { id: 0, name: '', country_id: '', state_id: '', is_active: true };
const filters = { name: '', country_id: '', state_id: '', is_active: '' };
const sorting = { sort: 'name', order: true };
const fields = "id, name, country_id, country_name, state_id, state_name, is_active";
const list = { countries: [], states: [] };
const columns = [
    { label: 'Name', value: "name", operator: 'ilike' },
    { label: 'Country', value: "country_id", operator: 'eq' },
    { label: 'State', value: "state_id", operator: 'eq' },
    { label: 'Active', value: "is_active", operator: 'eq' }
];
class Citites extends StoreBase {
    constructor() {
        super('public', 'Cities', 'City', 'vw_cities', 'cities', item, filters, sorting, fields, columns);
        this.column = { ...list };
        this.form = { ...list };
    }
    onInit(location) {
        const filterParams = { is_active: location.pathname.includes('management') ? '' : true };
        this.filters = { ...filters, ...filterParams };
        this.sorting = { ...sorting };
        this.pagination = { ...this.defaultPagination };
        this.getCountries();
        this.getData();
    }
    async getCountries() {
        const match = { is_active: true, 'states.is_active': true };
        const { success, data } = await getResult(this.schema, 'countries', 'id, name, states(id, name)', match, 'name');
        if (!success) return;
        this.column.countries = data;
        this.form.countries = data;
    }
    async onSave() {
        const { id, name, country_id, state_id, is_active } = this.item;
        await this.closeDrawer(id, { name, country_id, state_id, is_active });
    }
    onInsert() { this.openDrawer({ ...item }) }
    onEdit(item) { 
        this.form.states = item.country_id ? this.form.countries.find(x => x.id === item.country_id)?.states : [];
        this.openDrawer({ ...item })
     }
    onColumnCountryChange(country_id) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.country_id = country_id;
        this.filters.state_id = '';
        this.column.states = country_id ? this.column.countries.find(x => x.id === country_id)?.states : [];
        this.getData();
    }
    onFormCountryChange(country_id) {
        this.item.country_id = country_id;
        this.item.state_id = '';
        this.form.states = country_id ? this.form.countries.find(x => x.id === country_id)?.states : [];
    }
    onColumnStateChange(state_id) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.state_id = state_id;
        this.getData();
    }
}
Alpine.store('cities', new Citites());