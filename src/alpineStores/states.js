import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { getResult } from '../common/database';
const item = { id: 0, name: '', country_id: '', is_active: true };
const filters = { name: '', country_id: '', is_active: '' };
const sorting = { sort: 'name', order: true };
const fields = "id, name, country_id, country_name, is_active";
const list = { countries: [] };
const columns = [
    { label: 'Name', value: "name", operator: 'ilike' },
    { label: 'Country', value: "country_id", operator: 'eq' },
    { label: 'Active', value: "is_active", operator: 'eq' }
];
class States extends StoreBase {
    constructor() {
        super('public', 'States', 'State', 'vw_states', 'states', item, filters, sorting, fields, columns);
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
        const { success, data } = await getResult(this.schema, 'countries', 'id, name', { is_active: true }, 'name');
        if (!success) return;
        this.column.countries = data;
        this.form.countries = data;
    }
    onSave() {
        const { id, name, country_id, is_active } = this.item;
        this.closeDrawer(id, { name, country_id, is_active });
    }
    onInsert() { this.openDrawer({ ...item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('states', new States());