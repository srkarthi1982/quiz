import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { url } from '../lib/data';
import { supabase } from '../lib/supabase';
class Services extends StoreBase {
    static #item = { id: 0, name: '', image: '', file: null, is_active: true };
    static #filters = { name: '', counts: 0, is_active: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Ads', value: "counts", operator: 'gte' },
        { label: 'Active', value: "is_active", operator: 'eq' },
    ];
    constructor() {
        super('public', 'Services', 'Service', 'vw_services', 'services', Services.#item, Services.#filters, Services.#sorting, '*', Services.#columns);
        this.publicColumns = Services.#columns.filter(x => x.label !== 'Active');
    }
    onInit(location) {
        const filterParams = location.pathname.includes('management') ? { is_active: '', counts: 0 } : { is_active: true, counts: 1 };
        this.filters = { ...Services.#filters, ...filterParams };
        this.sorting = { ...Services.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        Alpine.store("loader").show();
        if (this.item.image && this.item.file) await supabase.storage.from("images").remove([`services/${this.item.image}`]).then(x => x);
        if (this.item.file) {
            const formData = new FormData();
            formData.append("table", "services");
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
    onInsert() { this.openDrawer({ ...Services.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('services', new Services());