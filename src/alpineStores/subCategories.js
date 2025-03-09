import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { url } from '../lib/data';
import { getResult } from '../common/database';
import { supabase } from '../lib/supabase';
class SubCategories extends StoreBase {
    static #item = { id: 0, name: '', image: '', category_id: '', file: null, is_active: true };
    static #filters = { name: '', category_id: '', counts: 0, is_active: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Category', value: "category_id", operator: 'eq' },
        { label: 'Ads', value: "counts", operator: 'gte' },
        { label: 'Active', value: "is_active", operator: 'eq' }
    ];
    static #list = { categories: [] };
    constructor() {
        super('public', 'Sub Categories', 'Sub Category', 'vw_subcategories', 'subcategories', SubCategories.#item, SubCategories.#filters, SubCategories.#sorting, '*', SubCategories.#columns);
        this.publicColumns = SubCategories.#columns.filter(x => !['Category', 'Active'].includes(x.label));
        this.column = { ...SubCategories.#list };
        this.form = { ...SubCategories.#list };
    }
    onInit(location) {
        const urlParams = new URLSearchParams(location.search);
        const filterParams = location.pathname.includes('management') ? {} : { is_active: true, counts: 0, category_id: urlParams.get('id') };
        this.filters = { ...SubCategories.#filters, ...filterParams };
        this.sorting = { ...SubCategories.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getCategories();
        this.getData();
    }
    async getCategories() {
        const { success, data } = await getResult(this.schema, 'categories', 'id, name', { is_active: true }, 'name');
        if (!success) return;
        this.column.categories = data;
        this.form.categories = data;
    }
    async onSave() {
        Alpine.store("loader").show();
        if (this.item.image && this.item.file) await supabase.storage.from("images").remove([`subcategories/${this.item.image}`]).then(x => x);
        if (this.item.file) {
            const formData = new FormData();
            formData.append("table", "subcategories");
            formData.append("file", this.item.file);
            const response = await fetch(url('api/storage'), { method: 'POST', body: formData });
            this.item.image = await response.text();
            if (!response.ok) {
                Alpine.store("loader").hide();
                Alpine.store('toast').show(message.replace('AuthApiError: ', ''), 'error');
                return;
            }
        }
        const { id, name, image, category_id, is_active } = this.item;
        await this.closeDrawer(id, { name, image, category_id, is_active });
    }
    onInsert() { this.openDrawer({ ...SubCategories.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('subcategories', new SubCategories());