import Alpine from 'alpinejs';
import { getSingle } from '../common/database';
const item = { id: '', name: '', duration: '', course_fees: '', exam_fees: '', detail: '', is_active: true };
Alpine.store('course', {
    item: {...item},
    onInit() { },
    async getCourse(id) {
        const match = { id };
        const { success } = await getSingle(this.schema, 'courses', '*', match);
        if (!success) return;
    }
});