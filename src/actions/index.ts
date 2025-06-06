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
      return { user: data.user, success: true, message: 'success' };
    }
  }),
  signUp: defineAction({
    input: z.object({
      email: z.string().email({ message: 'Invalid email address.' }),
      password: z.string().min(5, { message: 'Password must be at least 5 characters long.' }),
      name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
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
  forgotPassword: defineAction({
    input: z.object({
      email: z.string().email({ message: 'Invalid email address.' }),
    }),
    handler: async ({ email }) => {
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `http://localhost:4321/authentication/update-password`,
      });
  
      if (error) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
  
      return { message: 'A reset link has been sent to your email.' };
    },
  }),
  changePassword: defineAction({
    input: z.object({
      password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
    }),
    handler: async ({ password }, { request }) => {
      // Retrieve the user's access token from the request (cookies/session)
      const access_token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
      if (!access_token) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated.',
        });
      }
  
      const { data: userSession, error: sessionError } = await supabaseAdmin.auth.getUser(access_token);
  
      if (sessionError || !userSession) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Failed to fetch authenticated user.',
        });
      }
  
      // Now update the password
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userSession.user.id, { password });
  
      if (error) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
  
      return { message: 'Password updated successfully.' };
    },
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
  saveQuiz: defineAction({
    handler: async ({ title, schema, table, params }) => {
      const { data, error } = await supabaseAdmin.schema(schema).from(table).insert(params);
      if (error !== null) {
        if (error.code === '23505') throw new ActionError({ code: 'CONFLICT', message: `${title}: '${params.name}' already exists.` });
        else throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      }
      return data;
    }
  }),
  save: defineAction({
    handler: async ({ id, title, schema, table, params }) => {
      const { error } = id ?
        await supabaseAdmin.schema(schema).from(table).update(params).eq("id", id) :
        await supabaseAdmin.schema(schema).from(table).insert(params);
      if (error !== null) {
        if (error.code === '23505') throw new ActionError({ code: 'CONFLICT', message: `${title}: '${params.name}' already exists.` });
        else throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      }
      return true;
    }
  }),
  remove: defineAction({
    handler: async ({ id, schema, table }) => {
      const { error } = await supabaseAdmin.schema(schema).from(table).delete().eq("id", id);
      if (error !== null) {
        if (error) throw new ActionError({ code: 'BAD_REQUEST', message: error.message });
      }
      return true;
    }
  }),
  generateQuestion: defineAction({
    handler: async ({ numQuestions, platform, subject, topic, roadmap, level }) => {
      
      // 🔍 Step 1: Fetch existing questions
      const { data: existing, error: fetchError } = await supabase
        .from("questions")
        .select("q")
        .match({ roadmap_id: roadmap.id });
  
      if (fetchError) {
        throw new Error(`Failed to fetch existing questions: ${fetchError.message}`);
      }
  
      const existingQuestions = (existing || []).map(q => q.q.trim().toLowerCase());
  
      const system = `You are a subject matter expert generating non-repetitive multiple-choice questions.
      Avoid reusing any of the following existing questions:
      ${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;

      console.log('system', system);
      // 🧠 Step 2: Stream AI Questions
      const res = await streamObject({
        model: openai("gpt-4o-mini"),
        system,
        prompt: `Generate ${numQuestions} multiple-choice questions for the subject '${subject.name}' under the platform '${platform.name}' for the topic '${topic.name}' based on the roadmap '${roadmap.name}'.
  The difficulty level should be '${level.id}' (E = Easy, M = Medium, D = Difficult).
  Each question must include:
  - A question text
  - Four options
  - One correct answer (index 0–3)
  - A clear explanation referencing the correct answer`,
        schema: z.object({
          qz: z.array(
            z.object({
              q: z.string(),
              o: z.array(z.string()).length(4),
              a: z.number().min(0).max(3),
              e: z.string(),
            })
          ),
        }),
        temperature: 0.3,
      });
  
      // 🔄 Step 3: Parse streamed response
      const response = res.toTextStreamResponse();
      const reader = response?.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let questions = [];
  
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value, { stream: true });
          try {
            questions = JSON.parse(result);
          } catch (_) {}
        }
      }
  
      // 🧹 Step 4: Filter duplicates
      const filtered = questions.qz.filter((q: any) =>
        !existingQuestions.includes(q.q.trim().toLowerCase())
      );
  
      if (filtered.length === 0) {
        throw new Error("No new unique questions were generated.");
      }
  
      // 📝 Step 5: Prepare insert
      const params = filtered.map((qItem: any) => ({
        platform_id: platform.id,
        subject_id: subject.id,
        topic_id: topic.id,
        roadmap_id: roadmap.id,
        q: qItem.q,
        o: qItem.o,
        a: qItem.a,
        e: qItem.e,
        l: level.id,
        is_active: true,
      }));
  
      const { error: insertError } = await supabase.from("questions").insert(params);
      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }
  
      // ✅ Step 6: Update roadmap to active
      const { error: updateError } = await supabase
        .from("roadmaps")
        .update({ is_active: true })
        .eq("id", roadmap.id);
  
      if (updateError) {
        throw new Error(`Failed to update roadmap: ${updateError.message}`);
      }
  
      return { success: true, inserted: params.length };
    },
  }),  
  // generateQuestion: defineAction({
  //   handler: async ({ numQuestions, platform, subject, topic, roadmap, level }) => {
  //     // Stream AI-generated questions
  //     const res = await streamObject({
  //       model: openai("gpt-4o-mini"),
  //       system: "You are a subject matter expert generating multiple-choice questions.",
  //       prompt: `Generate ${numQuestions} multiple-choice questions for the subject '${subject.name}' under the platform '${platform.name}' for the topic '${topic.name}' based on the roadmap section '${roadmap.name}'. 
  //                The difficulty level should be '${level.id}' (E = Easy, M = Medium, D = Difficult).
  //                Each question should have four answer choices, one correct answer (as an index from 0 to 3), and a short explanation (that clearly mentions the correct answer by text).`,
  //       schema: z.object({
  //         qz: z.array(
  //           z.object({
  //             q: z.string(), // question
  //             o: z.array(z.string()).length(4), // options
  //             a: z.number().min(0).max(3), // correct answer index
  //             e: z.string(), // explanation
  //           })
  //         ),
  //       }),
  //       temperature: 0.3,
  //     });
  //     const response = res.toTextStreamResponse();
  //     let questions = [];
  //     const reader = response?.body?.getReader();
  //     const decoder = new TextDecoder();
  //     let result = "";
  //     if (reader) {
  //       while (true) {
  //         const { done, value } = await reader.read();
  //         if (done) break;
  //         result += decoder.decode(value, { stream: true });
  //         try {
  //           questions = JSON.parse(result);
  //         } catch (e) { }
  //       }
  //     }
  //     const params = questions.qz.map((qItem: any) => ({
  //       platform_id: platform.id,
  //       subject_id: subject.id,
  //       topic_id: topic.id,
  //       roadmap_id: roadmap.id,
  //       q: qItem.q,
  //       o: qItem.o,
  //       a: qItem.a,
  //       e: qItem.e,
  //       l: level.id,
  //       is_active: true,
  //     }));
  //     // Insert into Supabase
  //     const { error } = await supabase.from("questions").insert(params);
  //     if (error) {
  //       console.log('error', error)
  //       throw new Error(`Database insert failed: ${error.message}`);
  //     }
  //     return { success: true };
  //   },
  // }),
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
  }),
  verifyQuestion: defineAction({
    handler: async ({ id, question, options }) => {
      const prompt = `You are a subject matter expert. Given the following multiple-choice question and 4 options, identify the correct answer and provide a short explanation. Only return a JSON object with fields "a" (correct answer) and "e" (explanation).
      Question: ${question}
      Options: ${JSON.stringify(options)}
      Return format:
      {
        "a": correct_answer,
        "e": "Explanation of the correct answer"
      }`;
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        system: "You're an expert MCQ validator.",
        prompt,
        schema: z.object({
          a: z.string(),
          e: z.string()
        }),
        temperature: 0.2
      });
      const { a, e } = result.object;

      const normalizedAnswer = a.trim().toLowerCase();
      const index = options.findIndex((opt: string) => opt.trim().toLowerCase() === normalizedAnswer)
      if (index < 0) {
        throw new Error(`Correct answer "${a}" not found in options for question ID ${id}`);
      }
      const { error } = await supabase.from("questions").update({ a: index, e, is_active: true }).eq("id", id);
      if (error) {
        console.error('Update failed', error);
        throw new Error(`Failed to update question ${id}: ${error.message}`);
      }
      return true;
    }
  })
}