import Alpine from 'alpinejs';
import { actions } from 'astro:actions';
import { navigate } from 'astro:transitions/client';
class SignOut {
    onInit() { }
    async onSignOut() {
        Alpine.store("loader").show();
        const { error } = await actions.signOut();
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.message, 'error');
            return;
        }
        localStorage.removeItem('user');
        navigate('/');
    }
}
Alpine.store("signout", new SignOut());