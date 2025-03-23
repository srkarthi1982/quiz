import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import type { DomainMapping } from '../lib/types';
import { getPagerInfo } from '../common/utils';
import { supabase } from '../lib/supabase';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { generateObject, streamObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const environment: string = import.meta.env.ENVIRONMENT || 'DEV';
const domainMapping: DomainMapping = {
  'DEV': 'localhost',
  'PROD': 'quiz.institute'
};
const domain: string = domainMapping[environment];
const openai = createOpenAI({ apiKey: import.meta.env.OPENAI_API_KEY });

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
      name: z.string().min(5, { message: 'Phone must be at least 5 characters long.' }),
    }),
    handler: async ({ email, password, name }) => {
      const user_metadata = { name, role_id: 2 };
      const { error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata });
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
    }
  }),
  getFunctions: defineAction({
    accept: 'json',
    handler: async ({ schema, name, match }) => {
      const { data, error } = await supabase.schema(schema).rpc(name, match);
      if (error !== null) {
        if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      }
      return data;
    }
  }),
  getResult: defineAction({
    accept: 'json',
    handler: async ({ schema, table, fields, match, order }) => {
      const { data, error } = await supabase.schema(schema).from(table).select(fields).match(match).order(order);
      if (error !== null) {
        if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      }
      return data;
    }
  }),
  getSingle: defineAction({
    accept: 'json',
    handler: async ({ schema, table, fields, match }) => {
      const { data, error } = await supabase.schema(schema).from(table).select(fields).match(match).single();
      if (error !== null) {
        if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      }
      return data;
    }
  }),
  getPaginatedResult: defineAction({
    accept: 'json',
    handler: async ({ schema, view, fields, filters, columns, pagination, sorting }) => {
      const page = Number(pagination.page);
      const take = Number(pagination.take);
      const sort = sorting.sort;
      const order = Boolean(sorting.order);
      let query = supabase.schema(schema).from(view).select(fields, { count: "exact" });
      columns.forEach(({ value, operator }: any) => {
        const param = filters[value];
        if (param) query.filter(value, operator, operator === 'ilike' ? `%${param}%` : param);
      });
      if (sort !== null) query = query.order(sort, { ascending: order });
      const { data, count, error } = await query.range(((page - 1) * take), take * page - 1);
      if (error) return { success: false };
      const pageValues = getPagerInfo(data, page, take, count);
      return { data, count, pageValues };
    }
  }),
  save: defineAction({
    handler: async ({ id, title, schema, table, params }) => {
      const { error } = id ?
        await supabase.schema(schema).from(table).update(params).eq("id", id) :
        await supabase.schema(schema).from(table).insert(params);
      if (error !== null) {
        console.log('error', error)
        if (error.code === '23505') throw new ActionError({ code: 'CONFLICT', message: `${title}: '${params.name}' already exists.` });
        else throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      }
      return true;
    }
  }),
  remove: defineAction({
    handler: async ({ id, schema, table }) => {
      const { error } = await supabase.schema(schema).from(table).delete().eq("id", id);
      if (error !== null) {
        if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      }
      return true;
    }
  }),
  generateQuestion: defineAction({
    handler: async ({ numQuestions, platform, subject, topic, roadmap, level }) => {
      const result = await streamObject({
        model: openai("gpt-4o-mini"),
        system: "You are a subject matter expert generating accurate multiple-choice questions with correct answers and explanations.",
        prompt: `Generate ${numQuestions} multiple-choice questions for the subject '${subject}' under the platform '${platform}' for the topic '${topic}' based on the roadmap section '${roadmap}'. 
                 The difficulty level should be '${level}' (E = Easy, M = Medium, D = Difficult).
                 Each question should have four answer choices, one correct answer (as an **index** from 0 to 3), and a detailed explanation within 10 to 12 words.`,
        schema: z.object({
          qz: z.array(
            z.object({
              q: z.string(), // question
              o: z.array(z.string()).length(4), // options
              a: z.number().min(0).max(3), // correct_answer (index)
              e: z.string(), // explanation
            }),
          ),
        }),
        temperature: 0.3,
      });
      return result.toTextStreamResponse();
    }
  }),
  generateRoadmap: defineAction({
    handler: async ({ platform, subject, topic }) => {
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        system: "You are a subject matter expert generating structured roadmaps for learning.",
        prompt: `Generate complete structured roadmap sections for the subject '${subject.name}' under the platform '${platform.name}' for the topic '${topic.name}'. 
                 Each roadmap should be a concise phrase (3 to 6 words) covering key learning steps.`,
        schema: z.object({
          roadmaps: z.array(z.string()),
        }),
        temperature: 0.3,
      });
      const roadmaps = result.object.roadmaps.map(name => {
        return {
          platform_id: platform.id,
          subject_id: subject.id,
          topic_id: topic.id,
          name
        }
      })
      await supabase.schema("public").from("roadmaps").insert(roadmaps);
      return true;
    }
})

}