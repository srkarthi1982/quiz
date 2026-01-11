import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { Platform, and, asc, desc, eq, gte, lte, sql } from "astro:db";
import { platformRepository } from "./repositories";
import { requireAdmin } from "./_guards";

type SqlCondition = NonNullable<Parameters<typeof and>[number]>;
type PlatformRow = typeof Platform.$inferSelect;

const normalizePlatform = (row: PlatformRow) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  icon: row.icon,
  type: row.type,
  qCount: row.qCount ?? 0,
  isActive: row.isActive,
});

const platformPayloadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.string().nullable().optional(),
  qCount: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const platformFiltersSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  minQuestions: z.number().int().min(0).optional(),
  maxQuestions: z.number().int().min(0).optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
});

type PlatformFiltersInput = z.infer<typeof platformFiltersSchema>;

const platformSortSchema = z.object({
  column: z.enum(["name", "description", "type", "qCount", "status", "id"]),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

type PlatformSortInput = z.infer<typeof platformSortSchema>;

const normalizeInput = (input: z.infer<typeof platformPayloadSchema>) => {
  const name = input.name.trim();
  if (!name) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Name is required" });
  }

  const description = (input.description ?? "").trim();
  const icon = (input.icon ?? "").trim();
  const typeRaw = input.type ?? null;
  const type = typeRaw ? typeRaw.trim() : null;
  const qCountSource = input.qCount ?? 0;
  const qCount = Math.max(0, Number.isFinite(qCountSource) ? qCountSource : 0);
  const isActive = input.isActive ?? true;

  return {
    name,
    description,
    icon,
    type: type || null,
    qCount,
    isActive,
  };
};

const normalizeFilters = (filters?: PlatformFiltersInput) => {
  const safe = filters ?? {};
  const name = safe.name?.trim() ?? "";
  const description = safe.description?.trim() ?? "";
  const type = safe.type?.trim() ?? "";
  const hasMin =
    typeof safe.minQuestions === "number" &&
    Number.isFinite(safe.minQuestions) &&
    safe.minQuestions > 0;
  const hasMax =
    typeof safe.maxQuestions === "number" &&
    Number.isFinite(safe.maxQuestions) &&
    safe.maxQuestions > 0;
  let minQuestions = hasMin ? Math.max(0, Math.floor(safe.minQuestions)) : null;
  let maxQuestions = hasMax ? Math.max(0, Math.floor(safe.maxQuestions)) : null;

  if (minQuestions !== null && maxQuestions !== null && maxQuestions < minQuestions) {
    const swapped = minQuestions;
    minQuestions = maxQuestions;
    maxQuestions = swapped;
  }

  const status = safe.status ?? "all";

  return {
    name,
    description,
    type,
    minQuestions,
    maxQuestions,
    status,
  };
};

export const fetchPlatforms = defineAction({
  input: z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(500).default(10),
    filters: platformFiltersSchema.optional(),
    sort: platformSortSchema.optional(),
  }),
  async handler({ page, pageSize, filters, sort }) {
    const normalizedFilters = normalizeFilters(filters);
    const normalizedSort = sort ?? null;
    const conditions: SqlCondition[] = [];

    if (normalizedFilters.name) {
      conditions.push(
        sql`lower(${Platform.name}) LIKE ${`%${normalizedFilters.name.toLowerCase()}%`}`,
      );
    }

    if (normalizedFilters.description) {
      conditions.push(
        sql`lower(${Platform.description}) LIKE ${`%${normalizedFilters.description.toLowerCase()}%`}`,
      );
    }

    if (normalizedFilters.type) {
      conditions.push(
        sql`lower(coalesce(${Platform.type}, "")) LIKE ${`%${normalizedFilters.type.toLowerCase()}%`}`,
      );
    }

    if (normalizedFilters.minQuestions !== null) {
      conditions.push(gte(Platform.qCount, normalizedFilters.minQuestions));
    }

    if (normalizedFilters.maxQuestions !== null) {
      conditions.push(lte(Platform.qCount, normalizedFilters.maxQuestions));
    }

    if (normalizedFilters.status === "active") {
      conditions.push(eq(Platform.isActive, true));
    } else if (normalizedFilters.status === "inactive") {
      conditions.push(eq(Platform.isActive, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumnMap: Record<PlatformSortInput["column"], any> = {
      id: Platform.id,
      name: Platform.name,
      description: Platform.description,
      type: Platform.type,
      qCount: Platform.qCount,
      status: Platform.isActive,
    };

    const orderExpressions: any[] = [];
    if (normalizedSort) {
      const columnExpr = sortColumnMap[normalizedSort.column];
      if (columnExpr) {
        orderExpressions.push(
          normalizedSort.direction === "desc" ? desc(columnExpr) : asc(columnExpr),
        );
      }
    }

    if (!normalizedSort || normalizedSort.column !== "id") {
      orderExpressions.push(asc(Platform.id));
    }

    const result = await platformRepository.getPaginatedData({
      page,
      pageSize,
      where: () => whereClause,
      orderBy: () => orderExpressions,
    });

    return {
      items: result.data.map(normalizePlatform),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  },
});

export const createPlatform = defineAction({
  input: platformPayloadSchema,
  async handler(input, context: ActionAPIContext) {
    requireAdmin(context);
    const payload = normalizeInput(input);

    try {
      const inserted = await platformRepository.insert({
        name: payload.name,
        description: payload.description,
        icon: payload.icon,
        type: payload.type,
        qCount: payload.qCount,
        isActive: payload.isActive,
      });

      return normalizePlatform(inserted[0]);
    } catch (err: unknown) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: (err as Error)?.message ?? "Unable to create platform",
      });
    }
  },
});

export const updatePlatform = defineAction({
  input: z.object({
    id: z.number().int().min(1),
    data: platformPayloadSchema,
  }),
  async handler({ id, data }, context: ActionAPIContext) {
    requireAdmin(context);
    const payload = normalizeInput(data);

    const existing = await platformRepository.getById((table) => table.id, id);
    if (!existing) {
      throw new ActionError({ code: "NOT_FOUND", message: "Platform not found" });
    }

    try {
      const updated = await platformRepository.update(
        {
          name: payload.name,
          description: payload.description,
          icon: payload.icon,
          type: payload.type,
          qCount: payload.qCount,
          isActive: payload.isActive,
        },
        (table) => eq(table.id, id),
      );

      return normalizePlatform(updated[0]);
    } catch (err: unknown) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: (err as Error)?.message ?? "Unable to update platform",
      });
    }
  },
});

export const deletePlatform = defineAction({
  input: z.object({ id: z.number().int().min(1) }),
  async handler({ id }, context: ActionAPIContext) {
    requireAdmin(context);
    try {
      const deleted = await platformRepository.delete((table) => eq(table.id, id));

      if (!deleted[0]) {
        throw new ActionError({ code: "NOT_FOUND", message: "Platform not found" });
      }

      return { success: true };
    } catch (err: unknown) {
      if (err instanceof ActionError) {
        throw err;
      }

      throw new ActionError({
        code: "BAD_REQUEST",
        message: (err as Error)?.message ?? "Unable to delete platform",
      });
    }
  },
});
