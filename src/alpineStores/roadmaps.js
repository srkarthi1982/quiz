import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { actions } from 'astro:actions';
class Roadmaps extends StoreBase {
    static #item = { id: 0, name: '', platform_id: 0, subject_id: 0, topic_id: 0, is_active: true };
    static #filters = { name: '', is_active: '', platform_id: 32, subject_id: '', topic_id: '' };
    static #sorting = { sort: 'id', order: true };
    static #columns = [
        { label: 'Id', value: "id", operator: 'eq' },
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Platform', value: "platform_id", operator: 'eq' },
        { label: 'Subject', value: "subject_id", operator: 'eq' },
        { label: 'Topic', value: "topic_id", operator: 'eq' },
        { label: 'Active', value: "is_active", operator: 'eq' },
    ];
    static #list = { platforms: [], subjects: [], topics: [] };
    constructor() {
        super('public', 'Roadmaps', 'Roadmap', 'vw_roadmaps', 'roadmaps', Roadmaps.#item, Roadmaps.#filters, Roadmaps.#sorting, '*', Roadmaps.#columns);
        this.publicColumns = Roadmaps.#columns.filter(x => x.label === 'Name');
        this.parents = { ...Roadmaps.#list };
        this.column = { ...Roadmaps.#list };
        this.form = { ...Roadmaps.#list };
    }
    async onInit(location) {
        const params = new URLSearchParams(location.search);
        const platformId = params.get('platformId') || 0;
        const subjectId = params.get('subjectId') || 0;
        const topicId = params.get('topicId') || 0;
        const filterParams = location.pathname.includes('management') ? { is_active: '', counts: 0 } : { is_active: true, platform_id: Number(platformId), subject_id: Number(subjectId), topic_id: Number(topicId) };
        this.filters = { ...Roadmaps.#filters, ...filterParams };
        this.sorting = { ...Roadmaps.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
        this.getPlatforms();
        this.column.subjects = await this.getSubjects(this.filters.platform_id);
    }
    async getPlatforms() {
        Alpine.store("loader").show();
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'platforms', fields: 'id, name', match: { is_active: true }, order: 'name' });
        Alpine.store("loader").hide();
        if (error) return;
        this.column.platforms = data;
        this.form.platforms = data;
    }
    async getSubjects(platform_id) {
        Alpine.store("loader").show();
        const match = { platform_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'subjects', fields: 'id, name', match, order: 'name' });
        Alpine.store("loader").hide();
        if (error) return;
        return data;
    }
    async getTopics(subject_id) {
        Alpine.store("loader").show();
        const match = { subject_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'topics', fields: 'id, name', match, order: 'name' });
        Alpine.store("loader").hide();
        if (error) return;
        return data;
    }
    async onSave() {
        const { id, name, is_active, platform_id, subject_id, topic_id } = this.item;
        await this.closeDrawer(id, { name, is_active, platform_id, subject_id, topic_id });
    }
    onInsert() {
        this.form.subjects = [];
        this.form.topics = [];
        this.item = { id: 0, name: '', platform_id: 0, subject_id: 0, topic_id: 0, is_active: true };
        this.openDrawer({ ...Roadmaps.#item })
    }
    async onEdit(item) {
        this.form.subjects = await this.getSubjects(Number(item.platform_id));
        this.form.topics = await this.getTopics(Number(item.subject_id));
        this.openDrawer({ ...item });
        this.item.subject_id = Number(item.subject_id);
    }
    async onGenerateRoadmap() {
        Alpine.store("loader").show();
        const { platform_id, subject_id, topic_id } = this.filters;
        const platform = this.column.platforms.find(x => x.id === platform_id);
        const subject = this.column.subjects.find(x => x.id === subject_id);
        const topic = this.column.topics.find(x => x.id === topic_id);
        const { data, error } = await actions.generateRoadmap({ platform, subject, topic });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        if (data) this.getData();
    }
}
Alpine.store('roadmaps', new Roadmaps());