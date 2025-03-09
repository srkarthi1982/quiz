import Alpine from 'alpinejs';
import { copyToClipboard, debounce, getScreenSize, getTakeValue } from '../common/utils';
import { getPaginatedResult, getResult, save, remove } from '../common/database';
const item = { id: 0, name: '', email: '', phone: '', address: '', join_as: '', file: '', detail: '', status_id: '', created_at: '' };
const filters = { name: '', email: '', phone: '', address: '', join_as: '', file: '', detail: '', status_id: '', created_at: '' };
const screenSize = getScreenSize();
const pagination = { page: 1, take: getTakeValue(screenSize) };
const sorting = { sort: 'name', order: true };
const columns = [
    { label: 'Name', value: "name", operator: 'ilike' },
    { label: 'Email', value: "email", operator: 'ilike' },
    { label: 'Phone', value: "phone", operator: 'ilike' },
    { label: 'JoinAs', value: "join_as", operator: 'ilike' },
    { label: 'Address', value: "address", operator: 'ilike' },
    { label: 'File', value: "file", operator: 'ilike' },
    { label: 'Detail', value: "detail", operator: 'ilike' },
    { label: 'Status', value: "status_id", operator: 'eq' },
    { label: 'CreatedAt', value: "created_at", operator: 'eq' }
];
Alpine.store('careers', {
    schema: 'public',
    items: [],
    column: {
        statusList: []
    },
    form: {
        statusList: []
    },
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
        this.getStatusList();
    },
    async getStatusList() {
        const { success, data } = await getResult(this.schema, 'status', 'id, name', { is_active: true }, 'name');
        if (!success) return;
        this.column.statusList = data;
        this.form.statusList = data;
    },
    getData() {
        const { filters, columns } = this;
        const fields = "id, name, email, phone, address, join_as, file, detail, status_id, status_name, created_at";
        getPaginatedResult('Careers', this.schema, 'vw_careers', fields, filters, columns, this.pagination, this.sorting).then(({ success, data, count, pageValues }) => {
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
    onEdit({ id, name, email, phone, address, join_as, file, detail, status_id }) {
        this.item = { id, name, email, phone, address, join_as, file, detail, status_id };
        this.showDrawer = true;
    },
    copyId: id => copyToClipboard(id),
    async onDelete({ id, name }) {
        const result = await remove(id, 'Career', this.schema, 'careers', name);
        if (result) this.getData();
    },
    async onSave() {
        const { id, name, email, phone, address, join_as, file, detail, status_id } = this.item;
        const result = await save(id, 'Career', this.schema, 'careers', { name, email, phone, address, join_as, file, detail, status_id });
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
    }, 500),
    searchEmail: debounce(function (email) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.email = email;
        this.getData();
    }, 500),
    searchPhone: debounce(function (phone) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.phone = phone;
        this.getData();
    }, 500),
    searchJoinAs: debounce(function (join_as) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.join_as = join_as;
        this.getData();
    }, 500),
    searchAddress: debounce(function (address) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.address = address;
        this.getData();
    }, 500),
    searchFile: debounce(function (file) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.file = file;
        this.getData();
    }, 500),
    searchDetail: debounce(function (detail) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.detail = detail;
        this.getData();
    }, 500),
    onColumnStatusChange(status_id) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.status_id = status_id;
        this.getData();
    },
    onDateChange(created_at){
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.created_at = created_at;
        this.getData();
    },
    onFormStatusChange(status_id) {
        this.item.status_id = status_id;
    }
});