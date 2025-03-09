import Alpine from 'alpinejs';
import { actions } from 'astro:actions';
import { navigate } from 'astro:transitions/client';
Alpine.store("signup", {
    isLoading: false,
    name: '',
    email: '',
    phone: '',
    password: '',
    onInit() {},
    async onSubmit() {
        Alpine.store("loader").show();
        const { name, email, phone, password } = this;
        const { error } = await actions.signUp({name, email, phone, password});
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        navigate('/authentication/signin');
    }
});