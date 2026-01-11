import { ActionError, type ActionAPIContext } from "astro:actions";

const ADMIN_ROLE_ID = 1;

export const requireUser = (context: ActionAPIContext) => {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;
  if (!locals?.isAuthenticated || !user) {
    throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return user;
};

export const requireAdmin = (context: ActionAPIContext) => {
  const user = requireUser(context) as { roleId?: number | string };
  const roleId = Number(user?.roleId);
  if (!Number.isFinite(roleId) || roleId !== ADMIN_ROLE_ID) {
    throw new ActionError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return user;
};
