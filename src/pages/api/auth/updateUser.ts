import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id")?.toString() || '';
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const role_id = Number(formData.get("role_id"));

    if (!name || !email || !role_id) 
        return new Response("Name, Role fields are required", { status: 404 });
    
    const user_metadata = { name, role_id };
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { user_metadata });
    const { error: profilesError } = await supabase.schema('public').from('profiles').update({ name }).eq("id", id);
    const { error: userToRoleError } = await supabase.schema('public').from('user_to_role').update({ role_id }).eq("user_id", id);
    if (error) return new Response(error.message, { status: 404 });
    if (userToRoleError) return new Response(userToRoleError.message, { status: 404 });
    if (profilesError) return new Response(profilesError.message, { status: 404 });
    return new Response("Success", { status: 200 });
};
