import Alpine from 'alpinejs';
import { buildTreeView } from '../common/utils';
import { getResult, save } from '../common/database';
class Access {
    constructor() {
        this.schema = 'public';
        this.showAction = false;
        this.toggle = true;
        this.items = [];
        this.data = [];
        this.roles = [];
        this.role = {};
    }
    async onAssign() {
        const { id, name } = this.role;
        const menu_ids = this.getSelectedItems(this.items);
        const result = await save(id, 'Role', this.schema, 'roles', { name, menu_ids });
        if (!result) return;
        await this.getRoles();
    }
    getSelectedItems(items, selectedValues = []) {
        for (const item of items) {
            if (item.selected) selectedValues.push(item.value);
            if (item.children && item.children.length > 0) this.getSelectedItems(item.children, selectedValues);
        }
        return selectedValues;
    }
    toggleAll(open) {
        this.showAction = false;
        this.items = buildTreeView(this.data.map(x => ({ ...x, open })));
    }
    async onInit() {
        this.showAction = false;
        await this.getRoles();
        await this.getData();
        this.toggleAll(true);
    }
    async getData() {
        const match = { is_active: true };
        const { success, data } = await getResult(this.schema, 'menus', 'value, name, parent_id', match, ['parent_id', 'idx']);
        if (!success) return;
        this.data = data.map(({ value, name, parent_id }) => ({value, name, parent_id, selected: this.roles[0]?.menu_ids?.includes(value) || false}));
    }
    async getRoles() {
        const match = { is_active: true };
        const { success, data } = await getResult(this.schema, 'roles', 'id, name, menu_ids', match, 'name');
        if (!success) return;
        this.roles = data;
        this.role = data[0];
    }
    onRoleChange(id) {
        this.role = this.roles.find(x => x.id === Number(id));
        this.data = this.data.map(({ value, name, parent_id }) => ({value, name, parent_id, selected: this.role?.menu_ids?.includes(value) || false}));
        this.items = buildTreeView(this.data.map(x => ({ ...x, open: true })));
    }
}
Alpine.store('access', new Access());