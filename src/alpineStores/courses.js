import Alpine from 'alpinejs';
import { copyToClipboard, debounce, getScreenSize, getTakeValue } from '../common/utils';
import { getPaginatedResult, save, remove } from '../common/database';
const item = { id: 0, name: '', duration: '', course_fees: '', exam_fees: '', detail: '', is_active: true };
const filters = { name: '', duration: '', course_fees: '', exam_fees: '', detail: '', is_active: '' };
const screenSize = getScreenSize();
const pagination = { page: 1, take: getTakeValue(screenSize) };
const sorting = { sort: 'name', order: true };
const columns = [
    { label: 'Name', value: "name", operator: 'ilike' },
    { label: 'Detail', value: "detail", operator: 'ilike' },
    { label: 'Duration', value: "duration", operator: 'ilike' },
    { label: 'Course Fees', value: "course_fees", operator: 'ilike' },
    { label: 'Exam Fees', value: "exam_fees", operator: 'ilike' },
    { label: 'Active', value: "is_active", operator: 'eq' }
];
Alpine.store('courses', {
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
    onInit(location) {
        const filterParams = { is_active: location.pathname.includes('management') ? '' : true };
        this.filters = { ...filters, ...filterParams };
        this.sorting = { ...sorting };
        this.pagination = { ...pagination };
        this.total = 0;
        this.getData();
    },
    getData() {
        const { filters, columns } = this;
        const fields = "id, name, duration, course_fees, exam_fees, detail, is_active";
        getPaginatedResult('Courses', this.schema, 'courses', fields, filters, columns, this.pagination, this.sorting).then(({ success, data, count, pageValues }) => {
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
    onEdit({ id, name, duration, course_fees, exam_fees, detail, is_active }) {
        this.item = { id, name, duration, course_fees, exam_fees, detail, is_active };
        this.showDrawer = true;
    },
    copyId: id => copyToClipboard(id),
    async onDelete({ id, name }) {
        const result = await remove(id, 'Course', this.schema, 'courses', name);
        if (result) this.getData();
    },
    async onSave() {
        const { id, name, duration, course_fees, exam_fees, detail, is_active } = this.item;
        const result = await save(id, 'Course', this.schema, 'courses', { name, duration, course_fees, exam_fees, detail, is_active });
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
    searchDetail: debounce(function (detail) {
        this.pagination = { ...this.pagination, page: 1 };
        this.filters.detail = detail;
        this.getData();
    }, 500),
});