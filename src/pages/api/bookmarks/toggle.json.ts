import type { APIRoute } from "astro";
import { Bookmark, and, db, eq } from "astro:db";

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.isAuthenticated || !locals.user?.id) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 401 });
  }

  try {
    const body = await request.json();
    const entityType = String(body?.entityType ?? "").trim();
    const entityId = String(body?.entityId ?? "").trim();
    const label = typeof body?.label === "string" ? body.label.trim() : "";

    if (entityType !== "platform" || !entityId) {
      return new Response(JSON.stringify({ error: "BAD_REQUEST" }), { status: 400 });
    }

    const existing = await db
      .select({ id: Bookmark.id })
      .from(Bookmark)
      .where(
        and(
          eq(Bookmark.userId, locals.user.id),
          eq(Bookmark.entityType, entityType),
          eq(Bookmark.entityId, entityId),
        ),
      )
      .get();

    if (existing?.id) {
      await db.delete(Bookmark).where(eq(Bookmark.id, existing.id));
      return new Response(JSON.stringify({ active: false }), { status: 200 });
    }

    await db.insert(Bookmark).values({
      userId: locals.user.id,
      entityType,
      entityId,
      label: label || null,
    });

    return new Response(JSON.stringify({ active: true }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: "INTERNAL_SERVER_ERROR" }), { status: 500 });
  }
};
