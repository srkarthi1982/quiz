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
        const { data, error } = await actions.signIn({ email: this.email, password: this.password });
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        localStorage.setItem('user', JSON.stringify(data.user));
        const returnPath = document.cookie.split('; ').find(row => row.startsWith('return-path='))?.split('=')[1];
        if (returnPath) {
            document.cookie = 'return-path=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            navigate(decodeURIComponent(returnPath));
        } else {
            navigate("/");
        }
    }
}
Alpine.store("signin", new SignIn());