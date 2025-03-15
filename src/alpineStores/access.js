import Alpine from 'alpinejs';
import { buildTreeView } from '../common/utils';
import { actions } from 'astro:actions';
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
        Alpine.store("loader").show();
        const { id, name } = this.role;
        const menu_ids = this.getSelectedItems(this.items);
        const { data, error } = await actions.save({id, title: 'Role', schema: this.schema, table: 'roles', params: { name, menu_ids }});
        Alpine.store("loader").hide();
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        Alpine.store('toast').show(`Role: '${name}' assigned successfully.`, 'success');
        if(data) await this.getRoles();
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
        Alpine.store("loader").show();
        this.showAction = false;
        await this.getRoles();
        await this.getData();
        this.toggleAll(true);
        Alpine.store("loader").hide();
    }
    async getData() {
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'menus', fields: 'value, name, parent_id', match: { is_active: true }, order: ['parent_id', 'idx'] });
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        this.data = data.map(({ value, name, parent_id }) => ({ value, name, parent_id, selected: this.roles[0]?.menu_ids?.includes(value) || false }));
    }
    async getRoles() {
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'roles', fields: 'id, name, menu_ids', match: { is_active: true }, order: 'name' });
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        this.roles = data;
        this.role = data[0];
    }
    onRoleChange(id) {
        this.role = this.roles.find(x => x.id === Number(id));
        this.data = this.data.map(({ value, name, parent_id }) => ({ value, name, parent_id, selected: this.role?.menu_ids?.includes(value) || false }));
        this.items = buildTreeView(this.data.map(x => ({ ...x, open: true })));
    }
}
Alpine.store('access', new Access());