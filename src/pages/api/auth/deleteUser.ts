import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabaseAdmin";
export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id")?.toString() || '';
    if (!id) return new Response("Id is required", { status: 404 });
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) return new Response(error.message, { status: 404 });
    return new Response("Success", { status: 200 });
};
