import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { getResult } from '../common/database';
const item = { id: 0, question: '', answer: '', topic_id: '', is_active: true };
const filters = { question: '', answer: '', topic_id: '', is_active: '' };
const sorting = { sort: 'question', order: true };
const fields = "id, question, answer, topic_id, topic_name, is_active";
const columns = [
    { label: 'Question', value: "question", operator: 'ilike' },
    { label: 'Answer', value: "answer", operator: 'ilike' },
    { label: 'Topic', value: "topic_id", operator: 'eq' },
    { label: 'Active', value: "is_active", operator: 'eq' }
];
const list = { topics: [] };
class Faqs extends StoreBase {
    constructor() {
        super('public', 'Faqs', 'FAQ', 'vw_faqs', 'faqs', item, filters, sorting, fields, columns);
        this.column = { ...list };
        this.form = { ...list };
    }
    onInit(location) {
        const filterParams = { is_active: location.pathname.includes('management') ? '' : true };
        this.filters = { ...filters, ...filterParams };
        this.sorting = { ...sorting };
        this.pagination = { ...this.defaultPagination };
        this.getTopics();
        this.getData();
    }
    async getTopics() {
        const { success, data } = await getResult(this.schema, 'topics', 'id, name', { is_active: true }, 'name');
        if (!success) return;
        this.column.topics = data;
        this.form.topics = data;
    }
    async onSave() {
        const { id, question, answer, topic_id, is_active } = this.item;
        await this.closeDrawer(id, { question, answer, topic_id, is_active });
    }
    onInsert() { this.openDrawer({ ...item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('faqs', new Faqs());