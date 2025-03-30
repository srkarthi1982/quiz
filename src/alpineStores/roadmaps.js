import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { actions } from 'astro:actions';
class Roadmaps extends StoreBase {
    static #item = { id: 0, name: '', platform_id: 0, subject_id: 0, topic_id: 0, is_active: true };
    static #filters = { name: '', is_active: '', platform_id: '', subject_id: '', topic_id: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
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
    }
    async getPlatforms() {
        const { data, error } = await actions.getFunctions({ schema: this.schema, name: 'get_platforms_with_subjects_and_topics' });
        if (error) return;
        const { platforms, subjects, topics } = data;
        this.parents = { platforms, subjects, topics };
        this.column = { platforms, subjects: [], topics: [] };
        this.form = { platforms, subjects: [], topics: [] };
    }
    getSubjects() {
        this.form.subjects = this.parents.subjects.filter(x => x.platform_id === Number(this.item.platform_id));
    }
    getTopics() {
        this.form.topics = this.parents.topics.filter(x => x.subject_id === Number(this.item.subject_id));
    }
    async onSave() {
        Alpine.store("loader").show();
        const { id, name, is_active, platform_id, subject_id, topic_id } = this.item;
        await this.closeDrawer(id, { name, is_active, platform_id, subject_id, topic_id });
    }
    onInsert() {
        this.form.subjects = [];
        this.form.topics = [];
        this.item = { id: 0, name: '', platform_id: 0, subject_id: 0, topic_id: 0, is_active: true };
        this.openDrawer({ ...Roadmaps.#item })
    }
    onEdit(item) {
        this.form.subjects = this.parents.subjects.filter(x => x.platform_id === Number(item.platform_id));
        this.form.topics = this.parents.topics.filter(x => x.subject_id === Number(item.subject_id));
        this.openDrawer({ ...item });
        this.item.subject_id = Number(item.subject_id);
    }
    async onGenerateRoadmap() {
        Alpine.store("loader").show();
        const platform = this.column.platforms.find(x => x.id === this.filters.platform_id);
        const subject = this.column.subjects.find(x => x.id === this.filters.subject_id);
        const topic = this.column.topics.find(x => x.id === this.filters.topic_id);
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