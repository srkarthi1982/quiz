import Alpine from 'alpinejs';
import { supabase } from '../lib/supabase';
class ForgotPassword {
  constructor() {
    this.isLoading = false;
    this.email = '';
  }
  onInit() {}
  async onSubmit() {
    Alpine.store("loader").show();
    const { error } = await supabase.auth.resetPasswordForEmail(this.email, {
      redirectTo: 'https://www.quiz.institute/authentication/update-password'
    });
    Alpine.store("loader").hide();
    if (error) {
      console.log('error', error)
      Alpine.store('toast').show(error.message, 'error');
    } else {
      Alpine.store('toast').show('A reset link has been sent to your email.', 'success');
    }
  }
}
Alpine.store("forgotPassword", new ForgotPassword());
