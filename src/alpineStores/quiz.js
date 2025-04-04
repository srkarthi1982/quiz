import Alpine from 'alpinejs';
import { actions } from 'astro:actions';
class Quiz {
    static #selection = { platform_id: 0, subject_id: 0, topic_id: 0, roadmap_id: 0, level_id: '' };
    static #list = {
        platforms: [],
        subjects: [],
        topics: [],
        roadmaps: [],
        levels: [{ id: 'E', name: 'Easy', icon: 'fa-smile' }, { id: 'M', name: 'Medium', icon: 'fa-meh' }, { id: 'D', name: 'Difficult', icon: 'fa-frown' }],
        questions: []
    };
    constructor() {
        this.list = { ...Quiz.#list };
        this.selection = { ...Quiz.#selection };
        this.currentQuestion = 0;
        this.answers = {};
        this.search = '';
    }
    onInit(location) {
        if(location.search){
            const urlParams = new URLSearchParams(location.search);
            this.search = urlParams.get('platform');
        }
        this.getPlatforms();
    }
    async getPlatforms() {
        Alpine.store("loader").show();
        let match = { is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'platforms', fields: 'id, name, icon', match, order: 'name' });
        Alpine.store("loader").hide();
        if (error) return;
        this.list.platforms = data;
    }
    async getSubjects(platform_id) {
        this.search = '';
        Alpine.store("loader").show();
        this.list.subjects = [];
        const match = { platform_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'subjects', fields: 'id, name', match, order: 'name' });
        Alpine.store("loader").hide();
        if (error) return;
        this.list.subjects = data;
    }
    async getTopics(subject_id) {
        this.search = '';
        Alpine.store("loader").show();
        this.list.topics = [];
        const match = { subject_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'topics', fields: 'id, name', match, order: 'name' });
        Alpine.store("loader").hide();
        if (error) return;
        this.list.topics = data;
    }
    async getRoadmaps(topic_id) {
        this.search = '';
        Alpine.store("loader").show();
        this.list.roadmaps = [];
        const match = { topic_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'roadmaps', fields: 'id, name', match, order: 'id' });
        Alpine.store("loader").hide();``
        if (error) return;
        this.list.roadmaps = data;
    }
    async getQuestions() {
        Alpine.store("loader").show();
        this.list.questions = [];
        this.currentQuestion = 0;
        this.answers = {};
        const { platform_id, subject_id, topic_id, roadmap_id, level_id } = this.selection;
        const match = { pid: platform_id, sid: subject_id, tid: topic_id, rid: roadmap_id, level: level_id };
        const { data, error } = await actions.getFunctions({ schema: this.schema, name: 'get_random_questions', match });
        Alpine.store("loader").hide();
        if (error) return;
        this.list.questions = data;
    }
    get items() {
        return {
            platform: this.list.platforms.find(p => p.id === this.selection.platform_id)?.name,
            subject: this.list.subjects.find(s => s.id === this.selection.subject_id)?.name,
            topic: this.list.topics.find(t => t.id === this.selection.topic_id)?.name,
            roadmap: this.list.roadmaps.find(r => r.id === this.selection.roadmap_id)?.name,
            level: this.list.levels.find(l => l.id === this.selection.level_id)?.name,
        };
    }
}
Alpine.store('quiz', new Quiz());