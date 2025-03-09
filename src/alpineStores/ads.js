import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { getResult } from '../common/database';

class Ads extends StoreBase {
    static #item =  { id: '', is_active: true, is_verified: false, is_featured: false, name: '', store_id: '', ad_type_id: '', category_id: '', subcategory_id: '', service_id: '', subservice_id: '', updated_at: '', created_at: '', description: '', features: [''], images: [], files: [], imagesToDelete: [] };
    static #filters = { is_active: '', is_verified: '', is_featured: '', name: '', store_id: '', ad_type_id: '', category_id: '', subcategory_id: '', service_id: '', subservice_id: '', country_id: '', state_id: '', city_id: '', updated_at: '', created_at: '' };
    static #sorting = { sort: 'created_at', order: false };
    static #columns = [
        { label: 'Active', value: "is_active", operator: 'eq' },
        { label: 'Verified', value: "is_verified", operator: 'eq' },
        { label: 'Featured', value: "is_featured", operator: 'eq' },
        { label: 'Ad Title', value: "name", operator: 'ilike' },
        { label: 'Store Name', value: "store_name", operator: 'ilike' },
        { label: 'Ad Types', value: "ad_type_id", operator: 'eq' },
        { label: 'Categories', value: "category_id", operator: 'eq' },
        { label: 'SubCategories', value: "subcategory_id", operator: 'eq' },
        { label: 'Services', value: "service_id", operator: 'eq' },
        { label: 'SubServices', value: "subservice_id", operator: 'eq' },
        { label: 'Countries', value: "country_id", operator: 'eq' },
        { label: 'States', value: "state_id", operator: 'eq' },
        { label: 'Cities', value: "city_id", operator: 'eq' },
        { label: 'UpdatedAt', value: "updated_at", operator: 'eq' },
        { label: 'CreatedAt', value: "created_at", operator: 'eq' }, 
    ];
    static #list = { stores: [], ad_types: [], price_types: [], categories: [], subcategories: [], services: [], subservices: [], countries: [], states: [], cities: [] };
    constructor() {
        super('public', 'Ads', 'Ad', 'vw_ads', 'ads', Ads.#item, Ads.#filters, Ads.#sorting, "*", Ads.#columns);
        this.publicColumns = Ads.#columns.filter(x => ['Ad Title', 'Created At', 'Verified'].includes(x.label));
        this.column = { ...Ads.#list };
        this.form = { ...Ads.#list };
    }
    onInit(location) {
        const filterParams = { is_active: location.pathname.includes('management') ? '' : true };
        this.filters = { ...Ads.#filters, ...filterParams };
        this.sorting = { ...Ads.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getStores();
        this.getAdTypes();
        this.getPriceTypes();
        this.getCategories();
        this.getServices();
        this.getCountries();
        this.getData();
    }
    async getStores() {
        const match = { is_active: true };
        const { success, data } = await getResult(this.schema, 'stores', 'id, name, user_id', match, 'name');
        if (!success) return;
        this.column.stores = data;
        this.form.stores = data;
    }
    async getAdTypes() {
        const match = { is_active: true };
        const { success, data } = await getResult(this.schema, 'ad_types', 'id, name', match, 'name');
        if (!success) return;
        this.column.ad_types = data;
        this.form.ad_types = data;
    }
    async getPriceTypes() {
        const match = { is_active: true };
        const { success, data } = await getResult(this.schema, 'price_types', 'id, name', match, 'name');
        if (!success) return;
        this.column.price_types = data;
        this.form.price_types = data;
    }
    async getCategories() {
        const match = { is_active: true, 'subcategories.is_active': true };
        const { success, data } = await getResult(this.schema, 'categories', 'id, name, subcategories(id, name)', match, 'name');
        if (!success) return;
        this.column.categories = data;
        this.form.categories = data;
    }
    async getServices() {
        const match = { is_active: true, 'subservices.is_active': true };
        const { success, data } = await getResult(this.schema, 'services', 'id, name, subservices(id, name)', match, 'name');
        if (!success) return;
        this.column.services = data;
        this.form.services = data;
    }
    async getCountries() {
        const match = { is_active: true, 'states.is_active': true, 'states.cities.is_active': true };
        const { success, data } = await getResult(this.schema, 'countries', 'id, name, states(id, name, cities(id, name))', match, 'name');
        if (!success) return;
        this.column.countries = data;
        this.form.countries = data;
    }
    async onSave() {
        const { id, is_active, is_verified, is_featured, name, store_id, price_type_id, price, ad_type_id, category_id, subcategory_id, service_id, subservice_id, description, features, images, files, imagesToDelete } = this.item;
        console.log('files', files);
        console.log('imagesToDelete', imagesToDelete)
        const conditionalProps = ad_type_id == '1' ? { category_id, subcategory_id, service_id: null, subservice_id: null } : ad_type_id == '2' ? { category_id: null, subcategory_id: null, service_id, subservice_id } : {};
        await this.closeDrawer(id, { is_active, is_verified, is_featured, name, store_id, price_type_id, price, ad_type_id, ...conditionalProps, description, features, images, updated_at: new Date() });
    }
    onInsert() { this.openDrawer({ ...Ads.#item }) }
    onEdit(item) { 
        this.openDrawer({ ...item }) }
    onColumnCategoryChange(category_id) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.category_id = category_id;
        this.filters.subcategory_id = '';
        this.column.subcategories = category_id ? this.column.categories.find(x => x.id === category_id)?.subcategories : [];
        this.getData();
    }
    onColumnServiceChange(service_id) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.service_id = service_id;
        this.filters.subservice_id = '';
        this.column.subservices = service_id ? this.column.services.find(x => x.id === service_id)?.subservices : [];
        this.getData();
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
    onFormCategoryChange(category_id) {
        this.item.category_id = category_id;
        this.item.subcategory_id = '';
        this.form.subcategories = category_id ? this.form.categories.find(x => x.id === category_id)?.subcategories : [];
    }
    onFormServiceChange(service_id) {
        this.item.service_id = service_id;
        this.item.subservice_id = '';
        this.form.subservices = service_id ? this.form.services.find(x => x.id === service_id)?.subservices : [];
    }
}
Alpine.store('ads', new Ads());