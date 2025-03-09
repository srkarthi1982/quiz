import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, redirect }) => {
    const formData = await request?.formData();
    const password = formData.get("password")?.toString();
    if (!password) return new Response("Password is required", { status: 404 });
    const response: any = await supabase.auth.updateUser({ password })
    if (response.error) return new Response(response.error, { status: 404 });
    return redirect("/");
};