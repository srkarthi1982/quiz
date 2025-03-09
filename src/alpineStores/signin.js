import Alpine from 'alpinejs';
import { actions } from 'astro:actions';
import { navigate } from 'astro:transitions/client';
class SignIn {
    constructor() {
        this.isLoading = false;
        this.email = '';
        this.password = '';
    }
    onInit() { }
    async onSubmit() {
        Alpine.store("loader").show();
        const { error } = await actions.signIn({ email: this.email, password: this.password });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        navigate('/');
    }
}
Alpine.store("signin", new SignIn());