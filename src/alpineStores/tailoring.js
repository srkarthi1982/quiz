import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { url } from '../lib/data';
import { supabase } from '../lib/supabase';
class Tailoring extends StoreBase {
    static #item = { id: 0, name: '', image: '', price: '', file: null, is_active: true };
    static #filters = { name: '', is_active: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Price', value: "price", operator: 'eq' },
        { label: 'Active', value: "is_active", operator: 'eq' },
    ];
    constructor() {
        super('public', 'Tailoring', 'Tailoring', 'vw_tailoring', 'tailoring', Tailoring.#item, Tailoring.#filters, Tailoring.#sorting, '*', Tailoring.#columns);
        this.publicColumns = Tailoring.#columns.filter(x => x.label !== 'Active');
    }
    onInit(location) {
        const filterParams = location.pathname.includes('management') ? { is_active: '' } : { is_active: true };
        this.filters = { ...Tailoring.#filters, ...filterParams };
        this.sorting = { ...Tailoring.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        Alpine.store("loader").show();
        if (this.item.image && this.item.file) await supabase.storage.from("images").remove([`tailoring/${this.item.image}`]).then(x => x);
        if (this.item.file) {
            const formData = new FormData();
            formData.append("table", "tailoring");
            formData.append("file", this.item.file);
            const response = await fetch(url('api/storage'), { method: 'POST', body: formData });
            this.item.image = await response.text();
            if (!response.ok) {
                Alpine.store("loader").hide();
                Alpine.store('toast').show(message.replace('AuthApiError: ', ''), 'error');
                return;
            }
        }
        const { id, name, price, image, is_active } = this.item;
        await this.closeDrawer(id, { name, price, image, is_active });
    }
    onInsert() { this.openDrawer({ ...Tailoring.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('tailoring', new Tailoring());