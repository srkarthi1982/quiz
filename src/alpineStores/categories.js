import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { url } from '../lib/data';
import { supabase } from '../lib/supabase';
class Categories extends StoreBase {
    static #item = { id: 0, name: '', image: '', file: null, is_active: true };
    static #filters = { name: '', counts: 0, is_active: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Ads', value: "counts", operator: 'gte' },
        { label: 'Active', value: "is_active", operator: 'eq' },
    ];
    constructor() {
        super('public', 'Categories', 'Category', 'vw_categories', 'categories', Categories.#item, Categories.#filters, Categories.#sorting, '*', Categories.#columns);
        this.publicColumns = Categories.#columns.filter(x => x.label !== 'Active');
    }
    onInit(location) {
        const filterParams = location.pathname.includes('management') ? { is_active: '', counts: 0 } : { is_active: true, counts: 0 };
        this.filters = { ...Categories.#filters, ...filterParams };
        this.sorting = { ...Categories.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        Alpine.store("loader").show();
        if (this.item.image && this.item.file) await supabase.storage.from("images").remove([`categories/${this.item.image}`]).then(x => x);
        if (this.item.file) {
            const formData = new FormData();
            formData.append("table", "categories");
            formData.append("file", this.item.file);
            const response = await fetch(url('api/storage'), { method: 'POST', body: formData });
            this.item.image = await response.text();
            if (!response.ok) {
                Alpine.store("loader").hide();
                Alpine.store('toast').show(message.replace('AuthApiError: ', ''), 'error');
                return;
            }
        }
        const { id, name, image, is_active } = this.item;
        await this.closeDrawer(id, { name, image, is_active });
    }
    onInsert() { this.openDrawer({ ...Categories.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('categories', new Categories());