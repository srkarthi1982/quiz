import Alpine from 'alpinejs';
import { url } from '../lib/data';
class ResetPassword {
    constructor() {
        this.isLoading = false;
        this.password = '';
        this.showPassword = false;
    }
    onInit() {}
    async onSubmit() {
        this.isLoading = true;
        const formData = new FormData();
        formData.append("password", this.password);
        try {
            const response = await fetch(url('api/auth/resetPassword'), { method: 'POST', body: formData });
            const message = await response.text();
            if (!response.ok) {
                this.isLoading = false;
                Alpine.store('toast').show(message.replace('AuthWeakPasswordError: ', ''), 'error');
                return;
            }
            window.location = '/';
        } catch (error) {
            this.isLoading = false;
            Alpine.store('toast').show('An error occurred. Please try again.', 'error');
        }
    }
}
Alpine.store('resetPassword', new ResetPassword());