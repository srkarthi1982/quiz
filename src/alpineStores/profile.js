import Alpine from 'alpinejs';
import { getResult, getSingle } from '../common/database';
import { url } from '../lib/data';
import { createdDate } from '../common/utils';
const item = { id: '', name: '', email: '', phone: '', country_id: '', state_id: '', city_id: '' };
const list = { countries: [], states: [], cities: [] };
Alpine.store('profile', {
    item: { ...item },
    form: { ...list },
    onInit() { },
    createdDate,
    async getProfile(id) {
        await this.getCountries();
        const match = { id };
        const { success, data } = await getSingle(this.schema, 'vw_profiles', '*', match);
        if (!success) return;
        this.form.states = data.country_id ? this.form.countries.find(x => x.id === data.country_id)?.states : [];
        this.form.cities = data.state_id ? this.form.states.find(x => x.id === data.state_id)?.cities : [];
        this.item = {...data, created_at: createdDate(data.created_at)};
    },
    async getCountries() {
        const match = { is_active: true, 'states.is_active': true, 'states.cities.is_active': true };
        const { success, data } = await getResult(this.schema, 'countries', 'id, name, states(id, name, cities(id, name))', match, 'name');
        if (!success) return;
        this.form.countries = data;
    },
    async onSave() {
        Alpine.store("loader").show();
        const { id, name, email, phone, role_id, country_id, state_id, city_id } = this.item;
        const formData = new FormData();
        formData.append("id", id);
        formData.append("name", name);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("role_id", role_id);
        formData.append("country_id", country_id);
        formData.append("state_id", state_id);
        formData.append("city_id", city_id);
        const response = await fetch(url('api/auth/updateUser'), { method: 'POST', body: formData });
        const message = await response.text();
        Alpine.store("loader").hide();
        if (!response.ok) {
            Alpine.store('toast').show(message.replace('AuthApiError: ', ''), 'error');
            return;
        }
        Alpine.store('toast').show(`User: '${name}' updated successfully.`, 'success');
        this.getData();
        this.showDrawer = false;
    },
    onFormCountryChange(country_id) {
        this.item.country_id = country_id;
        this.item.state_id = '';
        this.item.city_id = '';
        this.form.states = country_id ? this.form.countries.find(x => x.id === country_id)?.states : [];
    },
    onFormStateChange(state_id) {
        this.item.state_id = state_id;
        this.item.city_id = '';
        this.form.cities = state_id ? this.form.states.find(x => x.id === state_id)?.cities : [];
    },
    onFormCityChange(city_id) {
        this.item.city_id = city_id;
    }
});