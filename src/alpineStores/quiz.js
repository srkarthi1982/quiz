import Alpine from 'alpinejs';
import { navigate } from 'astro:transitions/client';
import { actions } from 'astro:actions';
class Quiz {
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
        this.onRestart({ platform_id: 0, subject_id: 0, topic_id: 0, roadmap_id: 0, level_id: '', step: 1 });
    }
    async onInit(location) {
        let platform_id = 0;
        let subject_id = 0;
        let topic_id = 0;
        let roadmap_id = 0;
        let level_id = '';
        if (location.search) {
            const urlParams = new URLSearchParams(location.search);
            platform_id = Number(urlParams.get('platform_id')) || 0;
            subject_id = Number(urlParams.get('subject_id')) || 0;
            topic_id = Number(urlParams.get('topic_id')) || 0;
            roadmap_id = Number(urlParams.get('roadmap_id')) || 0;
            level_id = urlParams.get('level_id') || '';
        }
        const step = roadmap_id > 0 ? 5 : topic_id > 0 ? 4 : subject_id > 0 ? 3 : platform_id > 0 ? 2 : 1;
        this.onRestart({ platform_id, subject_id, topic_id, roadmap_id, level_id, step });
        await this.fetchQuizMetadata(platform_id, subject_id, topic_id);
    }
    
    onRestart(selection){
        this.step = selection.step;
        this.selection = selection;
        this.currentQuestion = 0;
        this.mark = 0;
        this.answers = {};
        this.search = '';
        this.isCompleted = false;
    }
    onRetake(){
        this.selection = {...this.selection, level_id: ''};
        this.currentQuestion = 0;
        this.mark = 0;
        this.answers = {};
        this.search = '';
        this.isCompleted = false;
    }
    onResults(){
        navigate('/results');
    }
    async fetchQuizMetadata(platform_id, subject_id, topic_id) {
        Alpine.store("loader").show();
        const { data, error } = await actions.getFunctions({
            schema: this.schema,
            name: 'get_quiz_metadata',
            match: { p_platform_id: platform_id, p_subject_id: subject_id, p_topic_id: topic_id }
        });
        console.log('data', data)
        Alpine.store("loader").hide();
        if (error) return;
        this.list.platforms = data.platforms || [];
        this.list.subjects = data.subjects || [];
        this.list.topics = data.topics || [];
        this.list.roadmaps = data.roadmaps || [];
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
        Alpine.store("loader").show();
        this.list.subjects = [];
        const match = { platform_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'subjects', fields: 'id, name, q_count', match, order: 'name' });
        Alpine.store("loader").hide();
        if (error) return;
        this.list.subjects = data;
        this.search = '';
    }
    async getTopics(subject_id) {
        Alpine.store("loader").show();
        this.list.topics = [];
        const match = { subject_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'topics', fields: 'id, name, q_count', match, order: 'name' });
        Alpine.store("loader").hide();
        if (error) return;
        this.list.topics = data;
        this.search = '';
    }
    async getRoadmaps(topic_id) {
        Alpine.store("loader").show();
        this.list.roadmaps = [];
        const match = { topic_id, is_active: true };
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'roadmaps', fields: 'id, name, q_count', match, order: 'id' });
        Alpine.store("loader").hide(); ``
        if (error) return;
        this.list.roadmaps = data;
        this.search = '';
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
    async onComplete(user_id) {
        if (this.answers[this.currentQuestion] !== undefined) {
            Alpine.store("loader").show();
            const { platform_id, subject_id, topic_id, roadmap_id, level_id } = this.selection;
            const params = {
                user_id, platform_id, subject_id, topic_id, roadmap_id, level: level_id,
                responses: this.list.questions.map((q, i) => ({ id: Number(q.id), a: Number(this.answers[i]) }))
            }
            const { error } = await actions.saveQuiz({ title: 'Quiz', schema: this.schema, table: 'results', params });
            Alpine.store("loader").hide();
            if (error) {
                Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
                return;
            }
            await this.getMarks(user_id);
            this.isCompleted = true;
        }
    }
    async getMarks(p_user_id){
        Alpine.store("loader").show();
        const { data, error } = await actions.getFunctions({ schema: this.schema, name: 'get_latest_mark_by_user', match: { p_user_id } });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        this.mark = data;
    }
}
Alpine.store('quiz', new Quiz());

