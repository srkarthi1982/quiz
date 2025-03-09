import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
class AdTypes extends StoreBase {
    static #item = { id: 0, name: '', is_active: true };
    static #filters = { name: '', is_active: true };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Ads', value: "counts", operator: 'eq' },
        { label: 'Active', value: "is_active", operator: 'eq' }
    ];
    constructor() {
        super('public', 'Ad Types', 'Ad Type', 'vw_ad_types', 'ad_types', AdTypes.#item, AdTypes.#filters, AdTypes.#sorting, '*', AdTypes.#columns);
    }
    onInit(location) {
        const filterParams = { is_active: location.pathname.includes('management') ? '' : true };
        this.filters = { ...AdTypes.#filters, ...filterParams };
        this.sorting = { ...AdTypes.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        const { id, name, is_active } = this.item;
        await this.closeDrawer(id, { name, is_active });
    }
    onInsert() { this.openDrawer({ ...AdTypes.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('adTypes', new AdTypes());