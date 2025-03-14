import Alpine from 'alpinejs';
import { actions } from 'astro:actions';
class Home {
    constructor(){
        this.platforms = [];
    }
    async onInit() {
        Alpine.store("loader").show();
        const {data, error} = await actions.getFunctions({name: 'get_home', schema: 'public'});
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        this.academy = data.platforms.filter(x => x.type === 'A');
        this.professionalSkills = data.platforms.filter(x => x.type === 'P');
    }
}
Alpine.store('home', new Home());