import Alpine from 'alpinejs';
import { getCookie } from '../common/utils';
import { actions } from 'astro:actions';
class Management {
    constructor() {
        this.functions = [];
    }
    async onInit() {
        Alpine.store("loader").show();
        const { data, error } = await actions.getFunctions({ schema: 'public', name: 'get_management', match: { role_id: getCookie('role').id } });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        this.functions = data;
    }
}
Alpine.store('management', new Management());