import Alpine from 'alpinejs';
import { supabase } from '../lib/supabase';
import { getPagerInfo } from './utils';
export const getPaginatedResult = async function (title, schema, table, fields, filters, columns, pagination, sorting) {
    const page = Number(pagination.page);
    const take = Number(pagination.take);
    const sort = sorting.sort;
    const order = Boolean(sorting.order);
    Alpine.store("loader").show();
    let query = supabase.schema(schema).from(table).select(fields, { count: "exact" });
    columns.forEach(({ value, operator }) => {
        const param = filters[value];
        if (param) query.filter(value, operator, operator === 'ilike' ? `%${param}%` : param);
    });
    if (sort !== null) query = query.order(sort, { ascending: order });
    const { data, count, error } = await query.range(((page - 1) * take), take * page - 1);
    Alpine.store("loader").hide();
    if (error) { 
        Alpine.store('toast').show(`${title}: ${error.message}`, 'error'); 
        return { success: false}; 
    }
    const pageValues = getPagerInfo(data, page, take, count);
    return { success: true, data, count, pageValues };
}
export const getResult = async function (schema, table, fields, match, order) {
    Alpine.store("loader").show();
    const { data, error } = await supabase.schema(schema).from(table).select(fields).match(match).order(order);
    Alpine.store("loader").hide();
    if (error) {
        Alpine.store('toast').show(error.message, 'error');
        return { success: false, data: [] }
    }
    return { success: true, data };
}
export const getSingle = async function (schema, table, fields, match) {
    Alpine.store("loader").show();
    const { data, error } = await supabase.schema(schema).from(table).select(fields).match(match).single();
    Alpine.store("loader").hide();
    if (error) {
        Alpine.store('toast').show(error.message, 'error');
        return { success: false, data: [] }
    }
    return { success: true, data };
}
export const getFunction = async function (schema, name, match) {
    Alpine.store("loader").show();
    const { data, error } = await supabase.schema(schema).rpc(name, match);
    Alpine.store("loader").hide();
    if (error) {
        Alpine.store('toast').show(error.message, 'error');
        return { success: false, data: [] }
    }
    return { success: true, data };
}
export const save = async function (id, title, schema, table, params) {
    Alpine.store("loader").show();
    const { error } = id ?
        await supabase.schema(schema).from(table).update(params).eq("id", id) :
        await supabase.schema(schema).from(table).insert(params);
    Alpine.store("loader").hide();
    if (error) {
        console.log('error', error)
        if (error.code === '23505') Alpine.store('toast').show(`${title}: '${params.name}' already exists.`, 'error');
        else Alpine.store('toast').show(error.message, 'error');
        return false;
    }
    Alpine.store('toast').show(`${title}: '${params.name}' saved successfully.`, 'success');
    return true;
}
export const remove = async function (id, title, schema, table, name) {
    if (!confirm(`Are you sure? you want to delete this ${title}: '${name}'? `)) return false;
    Alpine.store("loader").show();
    const { error } = await supabase.schema(schema).from(table).delete().eq("id", id);
    Alpine.store("loader").hide();
    if (error) { Alpine.store('toast').show(error.message, 'error'); return false; }
    Alpine.store('toast').show(`${title}: '${name}' deleted successfully.`, 'success');
    return true;
}