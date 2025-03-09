import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabaseAdmin";
export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const phone = formData.get("phone")?.toString();
  const password = formData.get("password")?.toString();
  if (!email || !password) {
    return new Response("Email and password are required", { status: 404 });
  }
  const user_metadata = { 
    name, 
    role_id: 2, 
    country_id: null, 
    state_id: null, 
    city_id: null 
  };
  const { error } = await supabase.auth.admin.createUser({ email, password, phone, email_confirm: true, user_metadata });
  if (error) return new Response(error.message, { status: 404 });
  return new Response("Success", { status: 200 });
};
