import Alpine from 'alpinejs';
import { getFunction } from '../common/database';
class Home {
    constructor(){
        this.ads = [];
        this.stores = [];
        this.categories = [];
        this.services = [];
        this.tailoring = []
    }
    async onInit() {
        const { success, data } = await getFunction('public', 'get_home', {});
        if (!success) return;
        this.ads = data.ads;
        this.stores = data.stores;
        this.categories = data.categories;
        this.services = data.services;
        this.tailoring = data.tailoring;
    }
}
Alpine.store('home', new Home());