import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
import { url } from '../lib/data';
import { getResult } from '../common/database';
import { supabase } from '../lib/supabase';
class SubServices extends StoreBase {
    static #item = { id: 0, name: '', image: '', service_id: '', file: null, is_active: true };
    static #filters = { name: '', service_id: '', counts: 0, is_active: '' };
    static #sorting = { sort: 'name', order: true };
    static #columns = [
        { label: 'Name', value: "name", operator: 'ilike' },
        { label: 'Service', value: "service_id", operator: 'eq' },
        { label: 'Ads', value: "counts", operator: 'gte' },
        { label: 'Active', value: "is_active", operator: 'eq' }
    ];
    static #list = { services: [] };
    constructor() {
        super('public', 'Sub Services', 'Sub Service', 'vw_subservices', 'subservices', SubServices.#item, SubServices.#filters, SubServices.#sorting, '*', SubServices.#columns);
        this.publicColumns = SubServices.#columns.filter(x => !['Service', 'Active'].includes(x.label));
        this.column = { ...SubServices.#list };
        this.form = { ...SubServices.#list };
    }
    onInit(location) {
        const urlParams = new URLSearchParams(location.search);
        const filterParams = location.pathname.includes('management') ? {} : { is_active: true, counts: 1, service_id: urlParams.get('id') };
        this.filters = { ...SubServices.#filters, ...filterParams };
        this.sorting = { ...SubServices.#sorting };
        this.pagination = { ...this.defaultPagination };
        this.getServices();
        this.getData();
    }
    async getServices() {
        const { success, data } = await getResult(this.schema, 'services', 'id, name', { is_active: true }, 'name');
        if (!success) return;
        this.column.services = data;
        this.form.services = data;
    }
    async onSave() {
        Alpine.store("loader").show();
        if (this.item.image && this.item.file) await supabase.storage.from("images").remove([`subservices/${this.item.image}`]).then(x => x);
        if (this.item.file) {
            const formData = new FormData();
            formData.append("table", "subservices");
            formData.append("file", this.item.file);
            const response = await fetch(url('api/storage'), { method: 'POST', body: formData });
            this.item.image = await response.text();
            if (!response.ok) {
                Alpine.store("loader").hide();
                Alpine.store('toast').show(message.replace('AuthApiError: ', ''), 'error');
                return;
            }
        }
        const { id, name, image, service_id, is_active } = this.item;
        await this.closeDrawer(id, { name, image, service_id, is_active });
    }
    onInsert() { this.openDrawer({ ...SubServices.#item }) }
    onEdit(item) { this.openDrawer({ ...item }) }
}
Alpine.store('subservices', new SubServices());