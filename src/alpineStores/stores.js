import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { getResult } from '../common/database';
import { url } from '../lib/data';
import { supabase } from '../lib/supabase';
const item = { id: '', user_id: '', package_id: '', is_active: '', is_verified: '', name: '', tagline: '', image: '', keyword_ids: [], about: '', address: '', location: '', timings: '', file: null };
const filters = { is_verified: '', is_active: '', user_name: '', email: '', phone: '', name: '', package_id: '', country_id: '', state_id: '', city_id: '', ads_count: '', views_count: '', created_at: '', updated_at: '' };
const sorting = { sort: 'name', order: true };
const fields = "*";
const columns = [
    { label: 'Verified', value: "is_verified", operator: 'eq' },
    { label: 'Active', value: "is_active", operator: 'eq' },
    { label: 'Store Name', value: "name", operator: 'ilike' },
    { label: 'User Name', value: "user_name", operator: 'ilike' },
    { label: 'Email', value: "email", operator: 'ilike' },
    { label: 'Phone', value: "phone", operator: 'ilike' },
    { label: 'Package', value: "package_id", operator: 'eq' },
    { label: 'Country', value: "country_id", operator: 'eq' },
    { label: 'State', value: "state_id", operator: 'eq' },
    { label: 'City', value: "city_id", operator: 'eq' },
    { label: 'Ads', value: "ads_count", operator: 'ilike' },
    { label: 'Views', value: "views_count", operator: 'ilike' },
    { label: 'UpdatedAt', value: "updated_at", operator: 'ilike' },
    { label: 'CreatedAt', value: "created_at", operator: 'ilike' }
];
const publicColumns = [
    { label: 'Name', value: "name", operator: 'ilike' },
    { label: 'Created At', value: "created_at", operator: 'ilike' },
    { label: 'Verified', value: "is_verified", operator: 'ilike' },
    { label: 'Ads', value: "ads_count", operator: 'eq' }
];
const list = { packages: [], countries: [], states: [], cities: [] };
class Stores extends StoreBase {
    constructor() {
        super('public', 'Stores', 'Store', 'vw_stores', 'stores', item, filters, sorting, fields, columns);
        this.publicColumns = publicColumns;
        this.column = { ...list };
        this.form = { ...list };
    }
    onInit(location) {
        const filterParams = { is_active: location.pathname.includes('management') ? '' : true };
        this.filters = { ...filters, ...filterParams };
        this.sorting = { ...sorting };
        this.pagination = { ...this.defaultPagination };
        this.getPackages();
        this.getCountries();
        this.getData();
    }
    async getPackages() {
        const match = { is_active: true };
        const { success, data } = await getResult(this.schema, 'packages', 'id, name', match, 'name');
        if (!success) return;
        this.column.packages = data;
        this.form.packages = data;
    }
    async getCountries() {
        const match = { is_active: true, 'states.is_active': true, 'states.cities.is_active': true };
        const { success, data } = await getResult(this.schema, 'countries', 'id, name, states(id, name, cities(id, name))', match, 'name');
        if (!success) return;
        this.column.countries = data;
        this.form.countries = data;
    }
    async onSave() {
        Alpine.store("loader").show();
        if (this.item.image && this.item.file) supabase.storage.from("images").remove(['stores/' + this.item.image]).then(x => x);
        if (this.item.file) {
            const formData = new FormData();
            formData.append("table", "stores");
            formData.append("file", this.item.file);
            const response = await fetch(url('api/storage'), { method: 'POST', body: formData });
            this.item.image = await response.text();
            if (!response.ok) {
                Alpine.store("loader").hide();
                Alpine.store('toast').show(message.replace('AuthApiError: ', ''), 'error');
                return;
            }
        }
        const { id, package_id, is_active, is_verified, name, tagline, image, about, address, location, timings } = this.item;
        await this.closeDrawer(id, { package_id, is_active, is_verified, name, tagline, image, about, address, location, timings });
    }
    onInsert() { this.openDrawer({ ...item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
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
}
Alpine.store('stores', new Stores());