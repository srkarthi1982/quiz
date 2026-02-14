import type { APIRoute } from "astro";
import { SESSION_COOKIE_NAME } from "../../../lib/auth";
import { resolveParentOrigin } from "../../../server/resolveParentOrigin";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const resolveToken = (cookies: APIRoute["prototype"]["cookies"], authHeader?: string | null) => {
  const cookieToken = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  if (!authHeader) return null;
  const [scheme, value] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return value;
};

export const GET: APIRoute = async ({ cookies, locals, request }) => {
  const token = resolveToken(cookies, request.headers.get("authorization"));
  if (!token) return json(401, { error: "Unauthorized" });

  try {
    const response = await fetch(`${resolveParentOrigin(locals)}/api/notifications/unread-count`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return json(response.status, { error: "Unauthorized" });
    }

    const data = await response.json();
    return json(200, { count: Number(data?.count ?? 0) });
  } catch {
    return json(500, { error: "Failed to load notifications" });
  }
};

export const POST: APIRoute = async () => json(405, { error: "Method Not Allowed" });
