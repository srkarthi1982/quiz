import Alpine from 'alpinejs';
import createBaseStore from './createBaseStore';
import { supabase } from '../lib/supabase';
const storeName = 'createAd';
const item = { };
const filters = { };
const sorting = { sort: 'name', order: true };
const columns = [];
const tableToSelect = 'vw_ads';
const tableToSave = 'ads';
const store = createBaseStore(item, filters, sorting, columns, tableToSelect, tableToSave);
Alpine.store(storeName, {
    ...store,
    ad_types: [],
    price_types: [],
    categories: [],
    services: [],
    stores: [],
    onInit() {},
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