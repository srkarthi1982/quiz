import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
class PriceTypes extends StoreBase {
    static #item = { id: 0, name: '', is_active: true };
    static #filters = { name: '', is_active: true };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Ads', value: "counts", operator: 'eq' },
        { label: 'Active', value: "is_active", operator: 'eq' }
    ];
    constructor() {
        super('public', 'Price Types', 'Price Type', 'vw_price_types', 'price_types', PriceTypes.#item, PriceTypes.#filters, PriceTypes.#sorting, '*', PriceTypes.#columns);
    }
    onInit(location) {
        const filterParams = { is_active: location.pathname.includes('management') ? '' : true };
        this.filters = { ...PriceTypes.#filters, ...filterParams };
        this.sorting = { ...PriceTypes.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        const { id, name, is_active } = this.item;
        await this.closeDrawer(id, { name, is_active });
    }
    onInsert() { this.openDrawer({ ...PriceTypes.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('priceTypes', new PriceTypes());