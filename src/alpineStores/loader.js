import Alpine from 'alpinejs';
class Loader {
    constructor() {
        this.visible = false;
    }
    show() {
        this.visible = true;
    }
    hide() {
        this.visible = false;
    }
}
Alpine.store('loader', new Loader());
