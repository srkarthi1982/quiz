import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
class Platforms extends StoreBase {
    static #item = { id: 0, name: '', description: '', icon: '', type: '', is_active: true };
    static #filters = { name: '', description: '', icon: '', type: '', is_active: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Description', value: "description", operator: 'ilike' },
        { label: 'Icon', value: "icon", operator: 'ilike' },
        { label: 'Type', value: "type", operator: 'eq' },
        { label: 'Active', value: "is_active", operator: 'eq' },
    ];
    static #list = { types: [{ id: 'A', name: 'A' }, { id: 'P', name: 'P' }] };
    constructor() {
        super('public', 'Platforms', 'Platform', 'vw_platforms', 'platforms', Platforms.#item, Platforms.#filters, Platforms.#sorting, '*', Platforms.#columns);
        this.publicColumns = Platforms.#columns.filter(x => x.label !== 'Active');
        this.column = { ...Platforms.#list };
        this.form = { ...Platforms.#list };
    }
    onInit(location) {
        const filterParams = location.pathname.includes('management') ? { is_active: '', counts: 0 } : { is_active: true, counts: 0 };
        this.filters = { ...Platforms.#filters, ...filterParams };
        this.sorting = { ...Platforms.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        Alpine.store("loader").show();
        const { id, name, description, is_active, icon, type } = this.item;
        await this.closeDrawer(id, { name, description, is_active, icon, type });
    }
    onInsert() { this.openDrawer({ ...Platforms.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('platforms', new Platforms());