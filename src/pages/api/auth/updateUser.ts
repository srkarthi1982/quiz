import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id")?.toString() || '';
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const phone = formData.get("phone")?.toString();
    const role_id = Number(formData.get("role_id"));

    if (!name || !email || !phone || !role_id) 
        return new Response("Name, Phone, Role fields are required", { status: 404 });
    
    const user_metadata = { name, role_id };
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { phone, user_metadata });
    const { error: profilesError } = await supabase.schema('public').from('profiles').update({ name, phone }).eq("id", id);
    const { error: userToRoleError } = await supabase.schema('public').from('user_to_role').update({ role_id }).eq("user_id", id);
    if (error) return new Response(error.message, { status: 404 });
    if (userToRoleError) return new Response(userToRoleError.message, { status: 404 });
    if (profilesError) return new Response(profilesError.message, { status: 404 });
    return new Response("Success", { status: 200 });
};
