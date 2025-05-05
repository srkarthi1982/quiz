import Alpine from 'alpinejs';
import { actions } from 'astro:actions';
import { buildTreeView, copyToClipboard } from '../common/utils';
const item = { id: '', value: '', idx: 0, name: '', link: '', parent_id: '', type: 'D', icon: '', is_active: true };
class Menus {
    constructor() {
        this.schema = 'public';
        this.item = { ...item };
        this.showAction = false;
        this.toggle = true;
        this.data = [];
    }
    onInsert() {
        this.showAction = false;
        this.item = { ...item };
        this.showDrawer = true;
    }
    onEdit({ id, value, idx, name, link, parent_id, type, icon, is_active }) {
        this.item = { id, value, idx, name, link, parent_id, type, icon, is_active };
        this.showDrawer = true;
    }
    copyId(id) { copyToClipboard(id) }
    async onSave() {
        const { id, value, idx, name, link, parent_id, type, icon, is_active } = this.item;
        const {error} = await actions.save({ id, title: 'Menu', schema: this.schema, table: 'menus', params: { value, idx, name, link, parent_id, type, icon, is_active } });
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        await this.onInit();
        this.showDrawer = false;
        this.item = { ...item };
    }
    async onRemove({ id, name }) {
        const { data, error } = await actions.remove({ id, schema: this.schema, table: 'menus' });
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        if (data) await this.onInit();
    }
    toggleAll(open) {
        this.showAction = false;
        this.items = buildTreeView(this.data.map(x => ({ ...x, open })));
    }
    async onInit() {
        this.showAction = false;
        const { data, error } = await actions.getResult({ schema: this.schema, table: 'menus', fields: '*', match: {}, order: ["parent_id", "idx"] });
        if (error) {
            Alpine.store('toast').show(error.issues?.length > 0 ? error.issues[0].message : error.message, 'error');
            return;
        }
        this.data = data;
        this.toggleAll(true);
    }
    onCreateChild({ value, children, type }) {
        this.showAction = false;
        const types = ['D', 'M', 'F', 'S', 'A'];
        const t = types[types.findIndex(x => x === type) + 1];
        this.item = { value, idx: children.length, name: '', link: '', parent_id: value, type: t, is_active: true };
        this.showDrawer = true;
    }
}
Alpine.store('menus', new Menus());