import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { actions } from 'astro:actions';
class Results extends StoreBase {
    static #item = { id: 0, user_id: '', platform_id: 0, subject_id: 0, topic_id: 0, roadmap_id: 0, level: '', mark: 0 };
    static #filters = { platform_id: 0, subject_id: 0, topic_id: 0, roadmap_id: 0, level: '' };
    static #sorting = { sort: 'created_at', order: false };
    static #columns = [
        { label: 'Platform', value: "platform_id", operator: 'eq' },
        { label: 'Subject', value: "subject_id", operator: 'eq' },
        { label: 'Topic', value: "topic_id", operator: 'eq' },
        { label: 'Roadmap', value: "roadmap_id", operator: 'eq' },
        { label: 'Level', value: "level", operator: 'eq' }
    ];
    static #list = { platforms: [], subjects: [], topics: [], roadmaps: [], levels: [{ id: 'E', name: 'Easy' }, { id: 'M', name: 'Medium' }, { id: 'D', name: 'Difficult' }] };
    constructor() {
        super('public', 'Results', 'Result', 'vw_results', 'results', Results.#item, Results.#filters, Results.#sorting, '*', Results.#columns);
         this.column = { ...Results.#list };
    }
    async onInit() {
        this.filters = { ...Results.#filters };
        this.sorting = { ...Results.#sorting };
        this.pagination = { ...this.defaultPagination, take: 6 };
        await this.getData(true);
        await this.getPlatforms();
    }
    async getPlatforms() {
        Alpine.store("loader").show();
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'platforms', fields: 'id, name', match: { is_active: true }, order: 'name' });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        this.column = { platforms: data, subjects: [], topics: [], levels: Results.#list.levels };
        this.form = { platforms: data, subjects: [], topics: [], levels: Results.#list.levels };
    }
    async getSubjects(platform_id) {
        Alpine.store("loader").show();
        const match = { platform_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'subjects', fields: 'id, name', match, order: 'name' });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        return data;
    }
    async getTopics(subject_id) {
        Alpine.store("loader").show();
        const match = { subject_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'topics', fields: 'id, name', match, order: 'name' });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        return data;
    }
    async getRoadmaps(topic_id) {
        Alpine.store("loader").show();
        const match = { topic_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'roadmaps', fields: 'id, name', match, order: 'id' });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        return data;
    }
    async getDetail(result_id) {
        Alpine.store("loader").show();
        const match = { result_id };
        const { data, error } = await actions.getFunctions({ schema: this.schema, name: 'get_result_details', match });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        return data;
    }
    getLevelName(level){
        switch (level) {
            case 'E': return 'Easy';
            case 'M': return 'Medium';
            case 'D': return 'Dificult'; 
        }
    }
    async onScore(id) {
        const data = await this.getDetail(id);
        this.openDrawer(data);
    }
}
Alpine.store('results', new Results());