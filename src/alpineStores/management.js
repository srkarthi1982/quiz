import Alpine from 'alpinejs';
import { getCookie } from '../common/utils';
import { getFunction } from '../common/database';
class Management {
    constructor(){
        this.functions = [];
    }
    async onInit() {
        const { data, success } = await getFunction('public', 'get_management', { role_id: getCookie('role').id });
        if (!success) return;
        this.functions = data;
    }
}
Alpine.store('management', new Management());