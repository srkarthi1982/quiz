import Alpine from 'alpinejs';
class Loader {
    constructor() {
        this.count = 0;
    }
    show() {
        this.count++;
    }
    hide() {
        if (this.count > 0) {
            this.count--;
        }
    }
    get visible() {
        return this.count > 0;
    }
}
Alpine.store('loader', new Loader());

