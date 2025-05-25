import { supabase } from '../lib/supabase';
import Alpine from "alpinejs";
import { navigate } from 'astro:transitions/client';
class UpdatePassword {
  constructor() {
    debugger;
    this.password = '';
    this.code = '';
  }

  async onInit() {
    const params = new URLSearchParams(window.location.search);
    this.code = params.get('code');
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(this.code);
    if (exchangeError) {
      return;
    }
  }
  async onSubmit() {
    Alpine.store("loader").show();
    const { error } = await supabase.auth.updateUser({ password: this.password });
    Alpine.store("loader").hide();
    if (error) {
      Alpine.store('toast').show(error.message, 'error');
    } else {
      Alpine.store('toast').show('Password updated. Please log in again.', 'success');
      navigate("/authentication/signin");
    }
  }
}
Alpine.store("updatePassword", new UpdatePassword());
