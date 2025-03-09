import Alpine from 'alpinejs';
import { getResult } from '../common/database';
class Faq {
    constructor() {
        this.schema = 'public';
        this.items = [];
        this.item = {};
    }
    async onInit() {
        const match = { is_active: true, 'faqs.is_active': true };
        const fields = "id, name, faqs(id, question, answer)";
        const { success, data } = await getResult(this.schema, "topics", fields, match, 'name');
        if (!success) return;
        this.items = data;
        this.item = data[0];
    }
    onItemChange(id) {
        this.item = this.items.find(x => x.id === id);
    }
}
Alpine.store('faq', new Faq());