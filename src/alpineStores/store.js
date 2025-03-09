import Alpine from 'alpinejs';
import { getSingle, save } from '../common/database';
import { createdDate } from '../common/utils';
import { StoreBase } from './StoreBase';
const item = { id: '', user_id: '', package_id: '', is_active: '', name: '', phone: '', tagline: '', image: '', about: '', address: '', location: '', timings: '', ads: {} };
const filters = { name: '', store_id: '', is_active: true, is_verified: true };
const sorting = { sort: 'created_at', order: false };
const fields = "*";
const columns = [
    { label: 'Ad Name', value: "name", operator: 'ilike' },
    { label: 'Store', value: "store_id", operator: 'eq' },
    { label: 'Active', value: "is_active", operator: 'eq' },
    { label: 'Verified', value: "is_verified", operator: 'eq' },
];
const publicColumns = [
    { label: 'Created At', value: "created_at", operator: 'ilike' },
    { label: 'Name', value: "name", operator: 'ilike' },
    { label: 'Featured', value: "is_featured", operator: 'ilike' },
]
class Store extends StoreBase {
    constructor() {
        super('public', 'Ads', 'Ad', 'vw_ads', 'ads', item, filters, sorting, fields, columns);
        this.publicColumns = publicColumns;
    }
    async onInit(location) {
        this.item = { ...item };
        const urlParams = new URLSearchParams(location.search);
        this.storeId = urlParams.get('id');
        this.filters = { ...filters, store_id: this.storeId };
        this.total = 0;
        this.getStore();
        this.getData();
    }
    async getStore() {
        const { success, data } = await getSingle(this.schema, 'vw_stores', '*', { id: this.storeId });
        if (!success) return;
        this.item = { ...data, created_at: createdDate(data.created_at) };
    }
    async onSave() {
        const { id, is_active, name, tagline, image, about, address, location, timings } = this.item;
        const result = await save(id, 'Store', this.schema, 'stores', { is_active, name, tagline, image, about, address, location, timings });
        if (!result) return;
        await this.getStore(id);
        this.item = { ...item };
    }
}
Alpine.store('store', new Store());