import Alpine from 'alpinejs';
import { StoreBase } from './StoreBase';
const item = { id: 0, message: '', is_read: '', created_at: '' };
const filters = {  message: '', is_read: '', created_at: '' };
const sorting = { sort: 'created_at', order: true };
const fields = "id, message, is_read, created_at";
const columns = [];
class Notifications extends StoreBase {
    constructor() {
        super('public', 'Notifications', 'Notification', 'notifications', 'notifications', item, filters, sorting, fields, columns);
    }
    onInit() {
        this.filters = { ...filters };
        this.sorting = { ...sorting };
        this.pagination = { ...this.defaultPagination };
        this.getData();
    }
    async onSave() {
        const { id, name, is_active } = this.item;
        await this.closeDrawer(id, { name, is_active });
    }
}
Alpine.store('notifications', new Notifications());



// import Alpine from 'alpinejs';

// Alpine.store('roles', {
//   items: [],
//   item: { id: '', name: '' },
//   filters:{
//     name: ''
//   },
//   showDrawer: false,
//   channel: null,
// getData(){
//     client.from("roles").select().then(({data, error}) => {
//         if (error) alert(error.message);
//         this.items = data || [];
//         this.channel = client.from("roles").on("*", (e) => this.onChange(e)).subscribe();
//         window.addEventListener("beforeunload", () => this.channel.unsubscribe());
//     });
// },
// async onSearch(){
//     const { data, error } = await client.from("roles").select().ilike('name', `%${this.filters.name}%`);
//     if (error) alert(error.message);
//     this.items = data || [];
// },
// onInsert(){
//     this.item = { id: '', name: '' };
//     this.showDrawer = true;
// },
// onEdit(selectedItem) {
//     this.item = { ...selectedItem };
//     this.showDrawer = true;
// },
// async onDelete(selectedItem){
//     const confirmed = confirm(`Are you sure? you want to delete this role '${selectedItem.name}'? `);
//     if(confirmed){
//         const {error} = await client.from("roles").delete().eq("id", selectedItem.id);
//         if (error) alert(error.message);
//          else this.item = { id: '', name: '' };
//     }
// },
// async onSubmit() {
//     const { error } = this.item.id ? 
//     await client.from("roles").update(this.item).eq("id", this.item.id) :
//     await client.from("roles").insert({name: this.item.name});
//     if (error) {
//         alert(error.message);
//         return;
//     }
//     this.showDrawer = false;
//     this.item = { id: '', name: '' };
// },
//   onChange(e) {
//     switch (e.eventType) {
//         case 'INSERT':
//             this.items.push(e.new);
//             break;
//         case 'UPDATE':
//             const index = this.items.findIndex((r) => r.id === e.new.id);
//             if (index !== -1) this.items.splice(index, 1, e.new);
//             break;
//         case 'DELETE':
//             this.items = this.items.filter((r) => r.id !== e.old.id);
//             break;
//     }
// }
// });