import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { Bookmark, Platform, and, db, desc, eq, sql } from "astro:db";
import { z } from "astro:schema";
import { requireUser } from "./_guards";

const bookmarkEntityTypeSchema = z.enum(["platform"]);

const normalizeEntityId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Entity id is required" });
  }
  return trimmed;
};

export const listBookmarks = defineAction({
  input: z.object({}).optional(),
  async handler(_input, context: ActionAPIContext) {
    const user = requireUser(context);

    const rows = await db
      .select({
        entityId: Bookmark.entityId,
        label: Bookmark.label,
        createdAt: Bookmark.createdAt,
        platformId: Platform.id,
        platformTitle: Platform.name,
        platformDescription: Platform.description,
        platformIcon: Platform.icon,
        platformType: Platform.type,
        platformQCount: Platform.qCount,
      })
      .from(Bookmark)
      .leftJoin(Platform, sql`${Bookmark.entityId} = CAST(${Platform.id} AS TEXT)`)
      .where(and(eq(Bookmark.userId, user.id), eq(Bookmark.entityType, "platform")))
      .orderBy(desc(Bookmark.createdAt), desc(Bookmark.id));

    return {
      items: rows.map((row) => ({
        entityId: row.entityId,
        label: row.label,
        createdAt: row.createdAt,
        platformId: row.platformId,
        platformTitle: row.platformTitle ?? row.label ?? `Platform ${row.entityId}`,
        platformDescription: row.platformDescription ?? "",
        platformIcon: row.platformIcon ?? "",
        platformType: row.platformType ?? null,
        platformQCount: row.platformQCount ?? 0,
      })),
    };
  },
});

export const toggleBookmark = defineAction({
  input: z.object({
    entityType: bookmarkEntityTypeSchema,
    entityId: z.string().min(1, "Entity id is required"),
    label: z.string().optional(),
  }),
  async handler(input, context: ActionAPIContext) {
    const user = requireUser(context);
    const entityId = normalizeEntityId(input.entityId);
    const label = input.label?.trim() || null;

    const existing = await db
      .select({ id: Bookmark.id })
      .from(Bookmark)
      .where(
        and(
          eq(Bookmark.userId, user.id),
          eq(Bookmark.entityType, input.entityType),
          eq(Bookmark.entityId, entityId),
        ),
      )
      .get();

    if (existing?.id) {
      await db.delete(Bookmark).where(eq(Bookmark.id, existing.id));
      return { active: false };
    }

    try {
      await db.insert(Bookmark).values({
        userId: user.id,
        entityType: input.entityType,
        entityId,
        label,
      });
      return { active: true };
    } catch {
      const stillExists = await db
        .select({ id: Bookmark.id })
        .from(Bookmark)
        .where(
          and(
            eq(Bookmark.userId, user.id),
            eq(Bookmark.entityType, input.entityType),
            eq(Bookmark.entityId, entityId),
          ),
        )
        .get();

      if (stillExists?.id) {
        return { active: true };
      }

      throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to toggle bookmark" });
    }
  },
});
