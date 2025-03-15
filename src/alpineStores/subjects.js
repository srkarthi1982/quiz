import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
class Subjects extends StoreBase {
    static #item = { id: 0, name: '', image: '', file: null, active: true };
    static #filters = { name: '', active: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Active', value: "active", operator: 'eq' },
    ];
    constructor() {
        super('public', 'Subjects', 'Subject', 'subjects', 'subjects', Subjects.#item, Subjects.#filters, Subjects.#sorting, '*', Subjects.#columns);
        this.publicColumns = Subjects.#columns.filter(x => x.label !== 'Active');
    }
    onInit(location) {
        const filterParams = location.pathname.includes('management') ? { active: '', counts: 0 } : { active: true, counts: 0 };
        this.filters = { ...Subjects.#filters, ...filterParams };
        this.sorting = { ...Subjects.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        Alpine.store("loader").show();
        const { id, name, slug, description, active, icon, type } = this.item;
        await this.closeDrawer(id, { name, slug, description, active, icon, type });
    }
    onInsert() { this.openDrawer({ ...Subjects.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('subjects', new Subjects());