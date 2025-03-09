import Alpine from 'alpinejs';
import createBaseStore from './createBaseStore';
import { debounce } from '../common/utils';
import { supabase } from '../lib/supabase';
const storeName = 'myAds';
const item = { id: '', is_active: true, is_featured: '', name: '', ad_type_id: '', category_id: '', subcategory_id: '', service_id: '', subservice_id: '', updated_at: '' };
const filters = { is_active: true, is_featured: '', name: '', ad_type_id: '', category_id: '', subcategory_id: '', service_id: '', subservice_id: '', updated_at: '' };
const sorting = { sort: 'name', order: true };
const columns = [
    { label: 'Active', value: "is_active", operator: 'eq' },
    { label: 'Featured', value: "is_featured", operator: 'eq' },
    { label: 'Ad Title', value: "name", operator: 'ilike' },
    { label: 'Ad Types', value: "ad_type_id", operator: 'eq' },
    { label: 'Categories', value: "category_id", operator: 'eq' },
    { label: 'SubCategories', value: "subcategory_id", operator: 'eq' },
    { label: 'Services', value: "service_id", operator: 'eq' },
    { label: 'SubServices', value: "subservice_id", operator: 'eq' },
    { label: 'UpdatedAt', value: "updated_at", operator: 'eq' },
];
const tableToSelect = 'vw_ads';
const tableToSave = 'ads';
const store = createBaseStore(item, filters, sorting, columns, tableToSelect, tableToSave);
Alpine.store(storeName, {
    ...store,
    onInit() {},
    ad_types: [],
    price_types: [],
    categories: [],
    services: [],
    updateName: debounce(function (name) {
        this.pagination = { ...this.pagination, page: 1, skip: 0 };this.filters.name = name; this.getData();
    }, 500),
    async getAdTypes() {
        const { data, error } = await supabase.from("ad_types").select().eq("is_active", true).order("name");
        if (error) alert(error.message);
        this.ad_types = data;
    },
    async getPriceTypes() {
        const { data, error } = await supabase.from("price_types").select().eq("is_active", true).order("name");
        if (error) alert(error.message);
        this.price_types = data;
    },
    async getCategories() {
        const { data, error } = await supabase.from("categories").select().eq("is_active", true).order("name");
        if (error) alert(error.message);
        this.categories = data;
    },
    async getServices() {
        const { data, error } = await supabase.from("services").select().eq("is_active", true).order("name");
        if (error) alert(error.message);
        this.services = data;
    },
});