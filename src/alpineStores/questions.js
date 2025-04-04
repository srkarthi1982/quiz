import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { actions } from 'astro:actions';
class Questions extends StoreBase {
    static #item = { id: 0, q: '', o: [], a: 0, e: '', l: '', platform_id: 0, subject_id: 0, topic_id: 0, roadmap_id: 0, is_active: true };
    static #filters = { q: '', e: '', l: '', is_active: '', platform_id: '', subject_id: '', topic_id: '', roadmap_id: '' };
    static #sorting = { sort: 'id', order: true };
    static #columns = [
        { label: 'Id', value: "id", operator: 'eq' },
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Platform', value: "platform_id", operator: 'eq' },
        { label: 'Subject', value: "subject_id", operator: 'eq' },
        { label: 'Topic', value: "topic_id", operator: 'eq' },
        { label: 'Roadmap', value: "roadmap_id", operator: 'eq' },
        { label: 'Level', value: "l", operator: 'eq' },
        { label: 'Active', value: "is_active", operator: 'eq' },
    ];
    static #list = { platforms: [], subjects: [], topics: [], roadmaps: [], levels: [{ id: 'E', name: 'Easy' }, { id: 'M', name: 'Medium' }, { id: 'D', name: 'Difficult' }] };
    constructor() {
        super('public', 'Questions', 'Question', 'questions', 'questions', Questions.#item, Questions.#filters, Questions.#sorting, '*', Questions.#columns);
        this.publicColumns = Questions.#columns.filter(x => x.label === 'Id');
        this.column = { ...Questions.#list };
        this.form = { ...Questions.#list };
    }
    async onInit() {
        this.filters = { ...Questions.#filters };
        this.sorting = { ...Questions.#sorting };
        this.pagination = { ...this.defaultPagination, take: 5 };
        this.getData();
        this.getPlatforms();
    }
    async getPlatforms() {
        Alpine.store("loader").show();
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'platforms', fields: 'id, name', match: { is_active: true }, order: 'name' });
        Alpine.store("loader").hide();
        if (error) return;
        this.column = { platforms: data, subjects: [], topics: [], levels: Questions.#list.levels };
        this.form = { platforms: data, subjects: [], topics: [], levels: Questions.#list.levels };
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
    async getRoadmaps(topic_id) {
        Alpine.store("loader").show();
        const match = { topic_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'roadmaps', fields: 'id, name', match, order: 'id' });
        Alpine.store("loader").hide();
        if (error) return;
        return data;
    }
    async onSave() {
        Alpine.store("loader").show();
        const { id, q, o, a, e, l, platform_id, subject_id, topic_id, roadmap_id, is_active } = this.item;
        await this.closeDrawer(id, { q, o, a, e, l, platform_id, subject_id, topic_id, roadmap_id, is_active });
    }
    onInsert() {
        this.form.subjects = [];
        this.form.topics = [];
        this.form.roadmaps = [];
        this.item = { id: 0, q: '', o: [], a: 0, e: '', l: 'E', platform_id: 0, subject_id: 0, topic_id: 0, roadmap_id: 0, is_active: true };
        this.openDrawer({ ...Questions.#item })
    }
    async onEdit(item) {
        this.form.subjects = await this.getSubjects(Number(item.platform_id));
        this.form.topics = await this.getTopics(Number(item.subject_id));
        this.form.roadmaps = await this.getRoadmaps(Number(item.topic_id));
        this.openDrawer({ ...item });
        this.item.subject_id = Number(item.subject_id);
        this.item.topic_id = Number(item.topic_id);
        this.item.roadmap_id = Number(item.roadmap_id);
    }
    async onGenerateQuestions() {
        Alpine.store("loader").show();
        const { platform_id, subject_id, topic_id, roadmap_id, l } = this.filters;
        const numQuestions = 40;
        const platform = this.column.platforms.find(x => x.id === platform_id);
        const subject = this.column.subjects.find(x => x.id === subject_id);
        const topic = this.column.topics.find(x => x.id === topic_id);
        const roadmap = this.column.roadmaps.find(x => x.id === roadmap_id);
        const level = this.column.levels.find(x => x.id === l);
        const { data, error } = await actions.generateQuestion({ numQuestions, platform, subject, topic, roadmap, level });
        Alpine.store("loader").hide();
        if (error) {
            alert(JSON.stringify(error));
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        if (data.success) this.getData();
    }
}
Alpine.store('questions', new Questions());