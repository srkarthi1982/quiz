import Alpine from 'alpinejs';
import { copyToClipboard, debounce, getScreenSize, getTakeValue } from '../common/utils';
import { getPaginatedResult, save, remove } from '../common/database';
const item = { id: 0, idx: 0, name: '', price: 0, ad_limit: 0, feature_limit: 0, ad_validity: 0, package_validity: 0, features_count: 0, images_count: 0, is_active: true, is_public: 'false' };
const filters = { id: '', idx: '', name: '', price: '', ad_limit: '', feature_limit: '', ad_validity: '', package_validity: '', features_count: '', images_count: '', is_active: true, is_public: ''  };
const screenSize = getScreenSize();
const pagination = { page: 1, take: getTakeValue(screenSize) };
const sorting = { sort: 'name', order: true };
const columns = [
    { label: 'Id', value: "id", operator: 'eq' },
    { label: 'Idx', value: "idx", operator: 'eq' },
    { label: 'Name', value: "name", operator: 'ilike' },
    { label: 'Price', value: "price", operator: 'eq' },
    { label: 'Ad Limit', value: "ad_limit", operator: 'eq' },
    { label: 'Feature Limit', value: "feature_limit", operator: 'eq' },
    { label: 'Ad Validity', value: "ad_validity", operator: 'eq' },
    { label: 'Package Validity', value: "package_validity", operator: 'eq' },
    { label: 'Features', value: "features_count", operator: 'eq' },
    { label: 'Images', value: "images_count", operator: 'eq' },
    { label: 'Active', value: "is_active", operator: 'eq' },
    { label: 'Public', value: "is_public", operator: 'eq' }
];
Alpine.store('packages', {
    schema: 'public',
    items: [],
    item: { ...item },
    filters: { ...filters },
    sorting: { ...sorting },
    pagination: { ...pagination },
    total: 0,
    showAction: false,
    pageValues: {
        start: 0,
        end: 0,
        pages: [],
        disableNextButton: { disabled: undefined },
        disablePreviousButton: { disabled: undefined },
        disablePager: { disabled: undefined },
    },
    showDrawer: false,
    columns,
    onInit() {
        this.showAction = false;
        this.filters = { ...filters };
        this.sorting = { ...sorting };
        this.pagination = { ...pagination };
        this.total = 0;
        this.getData();
    },
    getData() {
        const { filters, columns } = this;
        const fields = "id, idx, name, price, ad_limit, feature_limit, ad_validity, package_validity, features_count, images_count, is_active, is_public";
        getPaginatedResult('Packages', this.schema, 'vw_packages', fields, filters, columns, this.pagination, this.sorting).then(({ success, data, count, pageValues }) => {
            if (!success) return;
            this.items = data || [];
            this.total = count;
            this.pageValues = pageValues;
        });
    },
    onInsert() {
        this.showAction = false;
        this.item = { ...item };
        this.showDrawer = true;
    },
    onEdit({ id, idx, name, price, ad_limit, feature_limit, ad_validity, package_validity, features_count, images_count, is_active, is_public }) {
        this.item = { id, idx, name, price, ad_limit, feature_limit, ad_validity, package_validity, features_count, images_count, is_active, is_public };
        this.showDrawer = true;
    },
    copyId: id => copyToClipboard(id),
    async onDelete({ id, name }) {
        const result = await remove(id, 'Package', this.schema, 'packages', name);
        if (result) this.getData();
    },
    async onSave() {
        const { id, idx, name, price, ad_limit, feature_limit, ad_validity, package_validity, features_count, images_count, is_active, is_public } = this.item;
        const result = await save(id, 'Package', this.schema, 'packages', { idx, name, price, ad_limit, feature_limit, ad_validity, package_validity, features_count, images_count, is_active, is_public });
        if (result) {
            this.getData();
            this.showDrawer = false;
            this.item = { ...item };
        }
    },
    searchName: debounce(function (name) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.name = name;
        this.getData();
    }, 500)
});