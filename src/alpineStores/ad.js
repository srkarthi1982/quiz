import Alpine from 'alpinejs';
import { getSingle, save } from '../common/database';
import { createdDate } from '../common/utils';
const item = {id: '', is_active: '', is_verified: '', is_featured: '', name: '', store_id: '', ad_type_id: '', category_id: '', subcategory_id: '', service_id: '', subservice_id: '', country_id: '', state_id: '', city_id: '', updated_at: '', created_at: '', store: {} };
class Ad {
    constructor() {
        this.item = { ...item };
    }
    onInit() { }
    async getAd(id) {
        const match = { id };
        const { success, data } = await getSingle(this.schema, 'vw_ads', '*', match);
        if (!success) return;
        const { success: storeSuccess, data: storeData } = await getSingle(this.schema, 'vw_stores', '*', { id: data.store_id });
        if (!storeSuccess) return;
        this.item = { ...data, created_at: createdDate(data.created_at), store: { ...storeData } };
    }
    async onSave() {
        const { id, is_active, is_verified, is_featured, name, store_id, price_type_id, price, ad_type_id, category_id, subcategory_id, service_id, subservice_id, description } = this.item;
        const conditionalProps = ad_type_id === '1' ? { category_id, subcategory_id, service_id: null, subservice_id: null } : ad_type_id === '2' ? { category_id: null, subcategory_id: null, service_id, subservice_id } : {};
        const result = await save(id, 'Ads', this.schema, 'ads', { is_active, is_verified, is_featured, name, store_id, price_type_id, price, ad_type_id, ...conditionalProps, description, updated_at: new Date() });
        if (result) {
            await this.getAd(id);
            this.item = { ...item };
        }
    }
}
Alpine.store('ad', new Ad());