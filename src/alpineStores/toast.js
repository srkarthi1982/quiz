import Alpine from 'alpinejs';
Alpine.store('toast', {
    message: '',
    type: 'info',
    visible: false,
    show(message, type = 'info') {
        this.message = message;
        this.type = type;
        this.visible = true;
        setTimeout(() => this.visible = false, 3000);
    },
    hide() {
        this.visible = false;
    },
    get color() {
        switch (this.type) {
            case 'success':
                return 'bg-green-600 text-white';
            case 'error':
                return 'bg-red-600 text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    },
    get iconClass() {
        switch (this.type) {
            case 'success':
                return 'fa-circle-check';
            case 'error':
                return 'fa-circle-xmark';
            default:
                return 'fa-info-circle';
        }
    }
});