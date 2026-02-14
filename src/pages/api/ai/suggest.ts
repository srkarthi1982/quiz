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

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const cookieToken = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieToken) {
    return json(401, { error: "Unauthorized.", code: "UNAUTHORIZED" });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!cookieHeader) {
    return json(401, { error: "Unauthorized.", code: "UNAUTHORIZED" });
  }

  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    return json(400, { error: "Invalid request body.", code: "INVALID_BODY" });
  }

  const parentOrigin = resolveParentOrigin(locals);

  try {
    const response = await fetch(`${parentOrigin}/api/ai/suggest.json`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: cookieHeader,
      },
      body: bodyText,
    });

    const responseText = await response.text();
    return new Response(responseText || "{}", {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    return json(502, { error: "Gateway request failed.", code: "PARENT_REQUEST_FAILED" });
  }
};

export const GET: APIRoute = async () =>
  json(405, { error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" });
