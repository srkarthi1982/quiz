import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
class Platforms extends StoreBase {
    static #item = { id: 0, name: '', image: '', file: null, active: true };
    static #filters = { name: '', active: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Active', value: "active", operator: 'eq' },
    ];
    constructor() {
        super('public', 'Platforms', 'Platform', 'vw_platforms', 'platforms', Platforms.#item, Platforms.#filters, Platforms.#sorting, '*', Platforms.#columns);
        this.publicColumns = Platforms.#columns.filter(x => x.label !== 'Active');
    }
    onInit(location) {
        const filterParams = location.pathname.includes('management') ? { active: '', counts: 0 } : { active: true, counts: 0 };
        this.filters = { ...Platforms.#filters, ...filterParams };
        this.sorting = { ...Platforms.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        Alpine.store("loader").show();
        const { id, name, slug, description, active, icon, type } = this.item;
        await this.closeDrawer(id, { name, slug, description, active, icon, type });
    }
    onInsert() { this.openDrawer({ ...Platforms.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('platforms', new Platforms());