import Alpine from 'alpinejs';
import { actions } from 'astro:actions';
class Home {
    constructor() {
        this.academy = [];
        this.professionalSkills = [];
    }
    onInit() {
        Alpine.store("loader").show();
        actions.getFunctions({ schema: this.schema, name: 'get_home', match: {} }).then(({ data, error }) => {
            Alpine.store("loader").hide();
            if (error) return;
            this.academy = data.platforms.filter(x => x.type === 'A');
            this.professionalSkills = data.platforms.filter(x => x.type === 'P');
        });
    }
}
Alpine.store('home', new Home());