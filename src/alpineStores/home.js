import Alpine from 'alpinejs';
import { actions } from 'astro:actions';
class Home {
    constructor() {
        this.academy = [];
        this.professionalSkills = [];
    }
    async onInit() {
        Alpine.store("loader").show();
        const { data, error } = await actions.getFunctions({ schema: this.schema, name: 'get_home', match: {} });
        Alpine.store("loader").hide();
        if (error) return;
        this.academy = data.platforms.filter(x => x.type === 'A');
        this.professionalSkills = data.platforms.filter(x => x.type === 'P');
    }
}
Alpine.store('home', new Home());