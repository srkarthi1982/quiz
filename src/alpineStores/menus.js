import Alpine from 'alpinejs';
import { getResult, remove, save } from '../common/database';
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
        const result = await save(id, 'Menu', this.schema, 'menus', { value, idx, name, link, parent_id, type, icon, is_active });
        if (!result) return;
        await this.onInit();
        this.showDrawer = false;
        this.item = { ...item };
    }
    async onRemove({ id, name }) {
        const result = await remove(id, 'Menu', this.schema, 'menus', name);
        if (result) await this.onInit();
    }
    toggleAll(open) {
        this.showAction = false;
        this.items = buildTreeView(this.data.map(x => ({ ...x, open })));
    }
    async onInit() {
        this.showAction = false;
        const { success, data } = await getResult(this.schema, 'menus', '*', '', ["parent_id", "idx"]);
        if (!success) return;
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