import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { requireUser } from "./_guards";
import { buildQuizDashboardSummary } from "../dashboard/summary.schema";

export const fetchDashboardSummary = defineAction({
  accept: "json",
  async handler(_input, context: ActionAPIContext) {
    const user = requireUser(context);
    const userId = Number(user.id);
    if (!Number.isFinite(userId)) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Invalid user id." });
    }
    return await buildQuizDashboardSummary(userId);
  },
});
