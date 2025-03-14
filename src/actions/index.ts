import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import type { DomainMapping } from '../lib/types';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabaseAdmin';
const environment: string = import.meta.env.ENVIRONMENT || 'DEV';
const domainMapping: DomainMapping = {
  'DEV': 'localhost',
  'PROD': 'quiz.institute'
};
const domain: string = domainMapping[environment];
export const server = {
  signIn: defineAction({
    input: z.object({
      email: z.string().email({ message: 'Invalid email address.' }),
      password: z.string().min(5, { message: 'Password must be at least 5 characters long.' })
    }),
    handler: async ({ email, password }, context) => {
      const { data, error }: any = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new ActionError({ code: 'UNAUTHORIZED', message: error.message });
      const { access_token, refresh_token } = data.session;
      const { data: response }: any = await supabase.rpc("get_role_and_protected_routes", { roleid: data.user.user_metadata.role_id, uid: data.user.id });

      context.cookies.set("sb-access-token", access_token, { sameSite: "strict", domain, path: "/", secure: true });
      context.cookies.set("sb-refresh-token", refresh_token, { sameSite: "strict", domain, path: "/", secure: true });
      context.cookies.set("role", JSON.stringify(response.role).replace(/\s+/g, ''), { sameSite: "strict", domain, path: "/", secure: true });
      context.cookies.set("menus", JSON.stringify(response.menus).replace(/\s+/g, ''), { sameSite: "strict", domain, path: "/", secure: true });
      return { success: true, message: 'success' };
    }
  }),
  signUp: defineAction({
    input: z.object({
      email: z.string().email({ message: 'Invalid email address.' }),
      password: z.string().min(5, { message: 'Password must be at least 5 characters long.' }),
      phone: z.string().min(10, { message: 'Phone must be at least 10 characters long.' }),
      name: z.string().min(5, { message: 'Phone must be at least 5 characters long.' }),
    }),
    handler: async ({ email, password, phone, name }) => {
      const user_metadata = { 
        name, 
        role_id: 1, 
        country_id: null, 
        state_id: null, 
        city_id: null 
      };
      const { error } = await supabaseAdmin.auth.admin.createUser({ email, password, phone, email_confirm: true, user_metadata });
      if (error) throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return "Success"
    }
  }),
  signOut: defineAction({
    handler: async (_, context) => {
      const { error } = await supabase.auth.signOut();
      if (error) return { success: false, message: error.message };
      context.cookies.delete("sb-access-token", { path: "/", domain });
      context.cookies.delete("sb-refresh-token", { path: "/", domain });
      context.cookies.delete("role", { path: "/", domain });
      context.cookies.delete("menus", { path: "/", domain });
      context.cookies.delete("store", { path: "/", domain });
    }
  }),
  platforms: defineAction({
    accept: 'json',
    input: z.object({ /* ... */ }),
    handler: async () => {
      const platforms = await supabase.from("platforms").select("id, name");
      return platforms.data;
    },
  }),
  getFunctions: defineAction({
    accept: 'json',
    input: z.object({
      schema: z.string().min(6, { message: 'schema is required atleast 6 characters.' }),
      name: z.string().min(5, { message: 'Name is required.' })
    }),
    handler: async ({schema, name}) => {
      const platforms = await supabase.schema(schema).rpc(name);
      return platforms.data;
    },
  })
}