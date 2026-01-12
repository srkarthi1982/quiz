import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { Result } from "astro:db";
import { resultRepository } from "./repositories";
import { pushQuizActivity } from "../lib/pushActivity";

const responseSchema = z.object({
  id: z.number().int().min(1),
  a: z.number().int().min(-1),
  s: z.number().int().min(-1).optional(),
});

const saveResultInputSchema = z
  .object({
    platformId: z.number().int().min(1, "Platform is required"),
    subjectId: z.number().int().min(1, "Subject is required"),
    topicId: z.number().int().min(1, "Topic is required"),
    roadmapId: z.number().int().min(1, "Roadmap is required"),
    level: z.enum(["E", "M", "D"]),
    mark: z.number().int().min(0),
    responses: z.array(responseSchema).min(1, "Responses are required"),
  })
  .strict();

const requireUser = (context: ActionAPIContext) => {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;
  if (!user) {
    throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in to record quiz results." });
  }
  return user;
};

export const saveResult = defineAction({
  accept: "json",
  input: saveResultInputSchema,
  async handler(input, context) {
    const user = requireUser(context);
    const responses = input.responses.map((response) => ({
      id: response.id,
      a: response.a,
      s: typeof response.s === "number" ? response.s : -1,
    }));

    const payload: typeof Result.$inferInsert = {
      userId: user.id,
      platformId: input.platformId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      roadmapId: input.roadmapId,
      level: input.level,
      responses,
      mark: input.mark,
    };

    const [result] = await resultRepository.insert(payload);
    pushQuizActivity(user.id);
    return { result };
  },
});
