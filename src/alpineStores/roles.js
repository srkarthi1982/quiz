import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
class Roles extends StoreBase {
    static #item = { id: 0, name: '', is_active: true };
    static #filters = { name: '', is_active: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Users', value: "counts", operator: 'eq' },
        { label: 'Active', value: "is_active", operator: 'eq' }
    ];
    constructor() {
        super('public', 'Roles', 'Role', 'vw_roles', 'roles', Roles.#item, Roles.#filters, Roles.#sorting, '*', Roles.#columns);
    }
    onInit() {
        this.filters = { ...Roles.#filters };
        this.sorting = { ...Roles.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        const { id, name, is_active } = this.item;
        await this.closeDrawer(id, { name, is_active });
    }
    onInsert() { this.openDrawer({ ...Roles.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('roles', new Roles());