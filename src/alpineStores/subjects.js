import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { actions } from 'astro:actions';
class Subjects extends StoreBase {
    static #item = { id: 0, name: '', platform_id: '', is_active: true };
    static #filters = { name: '', is_active: '', platform_id: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Active', value: "is_active", operator: 'eq' },
        { label: 'Platform', value: "platform_id", operator: 'eq' },
    ];
    static #list = { platforms: [] };
    constructor() {
        super('public', 'Subjects', 'Subject', 'vw_subjects', 'subjects', Subjects.#item, Subjects.#filters, Subjects.#sorting, '*', Subjects.#columns);
        this.publicColumns = Subjects.#columns.filter(x => x.label === 'Name');
        this.column = { ...Subjects.#list };
        this.form = { ...Subjects.#list };
    }
    onInit(location) {
        const params = new URLSearchParams(location.search);
        const platformId = params.get('platformId') || 0;
        const filterParams = location.pathname.includes('management') ? { is_active: '', counts: 0 } : { is_active: true, platform_id: Number(platformId) };
        this.filters = { ...Subjects.#filters, ...filterParams };
        this.sorting = { ...Subjects.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
        this.getPlatforms();
    }
    async getPlatforms() {
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'platforms', fields: 'id, name', match: { is_active: true }, order: 'name' });
        if (error) return;
        this.column.platforms = data;
        this.form.platforms = data;
    }
    async onSave() {
        const { id, name, is_active, platform_id } = this.item;
        await this.closeDrawer(id, { name, is_active, platform_id });
    }
    onInsert() { this.openDrawer({ ...Subjects.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('subjects', new Subjects());