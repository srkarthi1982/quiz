import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { actions } from 'astro:actions';
class Topics extends StoreBase {
    static #item = { id: 0, name: '', platform_id: 0, subject_id: 0, is_active: true };
    static #filters = { name: '', is_active: '', platform_id: '', subject_id: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Platform', value: "platform_id", operator: 'eq' },
        { label: 'Subject', value: "subject_id", operator: 'eq' },
        { label: 'Active', value: "is_active", operator: 'eq' },
    ];
    static #list = { platforms: [], subjects: [] };
    constructor() {
        super('public', 'Topics', 'Topic', 'vw_topics', 'topics', Topics.#item, Topics.#filters, Topics.#sorting, '*', Topics.#columns);
        this.publicColumns = Topics.#columns.filter(x => x.label === 'Name');
        this.parents = { ...Topics.#list };
        this.column = { ...Topics.#list };
        this.form = { ...Topics.#list };
    }
    async onInit(location) {
        const params = new URLSearchParams(location.search);
        const platformId = params.get('platformId') || 0;
        const subjectId = params.get('subjectId') || 0;
        const filterParams = location.pathname.includes('management') ? { is_active: '', counts: 0 } : { is_active: true, platform_id: Number(platformId), subject_id: Number(subjectId) };
        this.filters = { ...Topics.#filters, ...filterParams };
        this.sorting = { ...Topics.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
        this.getPlatforms();
    }
    async getPlatforms() {
        const { data, error } = await actions.getFunctions({ schema: this.schema, name: 'get_platforms_with_subjects' });
        if (error) return;
        const { platforms, subjects } = data;
        this.parents = { platforms, subjects };

        this.column = { platforms, subjects: [] };
        this.form = { platforms, subjects: [] };
    }
    getSubjects() {
        this.form.subjects = this.parents.subjects.filter(x => x.platform_id === Number(this.item.platform_id));
    }
    async onSave() {
        Alpine.store("loader").show();
        const { id, name, is_active, platform_id, subject_id } = this.item;
        await this.closeDrawer(id, { name, is_active, platform_id, subject_id });
    }
    onInsert() { 
        this.form.subjects = [];
        this.item = { id: 0, name: '', platform_id: 0, subject_id: 0, is_active: true };
        this.openDrawer({ ...Topics.#item }) 
    }
    onEdit(item) { 
        this.form.subjects = this.parents.subjects.filter(x => x.platform_id === Number(item.platform_id));
        this.openDrawer({ ...item });
        this.item.subject_id = Number(item.subject_id);
    }
}
Alpine.store('topics', new Topics());