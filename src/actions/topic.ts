import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { Platform, Subject, Topic, and, asc, desc, eq, gte, lte, sql } from "astro:db";
import { platformRepository, subjectRepository, topicQueryRepository, topicRepository } from "./repositories";

type SqlCondition = NonNullable<Parameters<typeof and>[number]>;
type TopicRow = typeof Topic.$inferSelect;

const normalizeTopic = (row: TopicRow & { subjectName?: string | null; platformName?: string | null }) => ({
  id: row.id,
  platformId: row.platformId,
  subjectId: row.subjectId,
  name: row.name,
  isActive: row.isActive,
  qCount: row.qCount ?? 0,
  subjectName: row.subjectName ?? null,
  platformName: row.platformName ?? null,
});

const topicPayloadSchema = z.object({
  platformId: z.number().int().min(1, "Platform is required"),
  subjectId: z.number().int().min(1, "Subject is required"),
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().optional(),
  qCount: z.number().int().min(0).optional(),
});

const topicFiltersSchema = z.object({
  name: z.string().optional(),
  platformId: z.number().int().min(1).optional(),
  subjectId: z.number().int().min(1).optional(),
  minQuestions: z.number().int().min(0).optional(),
  maxQuestions: z.number().int().min(0).optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
});

type TopicFiltersInput = z.infer<typeof topicFiltersSchema>;

const topicSortSchema = z.object({
  column: z.enum(["name", "subjectName", "platformName", "platformId", "subjectId", "qCount", "status", "id"]),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

type TopicSortInput = z.infer<typeof topicSortSchema>;

const normalizeInput = (input: z.infer<typeof topicPayloadSchema>) => {
  const name = input.name.trim();
  if (!name) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Name is required" });
  }

  const platformId = input.platformId;
  if (!Number.isFinite(platformId) || platformId <= 0) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Platform is required" });
  }

  const subjectId = input.subjectId;
  if (!Number.isFinite(subjectId) || subjectId <= 0) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Subject is required" });
  }

  const qCountSource = input.qCount ?? 0;
  const qCount = Math.max(0, Number.isFinite(qCountSource) ? qCountSource : 0);
  const isActive = input.isActive ?? true;

  return {
    platformId: Math.floor(platformId),
    subjectId: Math.floor(subjectId),
    name,
    qCount,
    isActive,
  };
};

const normalizeFilters = (filters?: TopicFiltersInput) => {
  const safe = filters ?? {};
  const name = safe.name?.trim() ?? "";
  const platformId =
    safe.platformId && Number.isFinite(safe.platformId) ? Math.floor(safe.platformId) : null;
  const subjectId =
    safe.subjectId && Number.isFinite(safe.subjectId) ? Math.floor(safe.subjectId) : null;
  const hasMin = typeof safe.minQuestions === "number" && Number.isFinite(safe.minQuestions);
  const hasMax = typeof safe.maxQuestions === "number" && Number.isFinite(safe.maxQuestions);
  let minQuestions = hasMin ? Math.max(0, Math.floor(safe.minQuestions || 0)) : null;
  let maxQuestions = hasMax ? Math.max(0, Math.floor(safe.maxQuestions || 0)) : null;

  if (minQuestions !== null && maxQuestions !== null && maxQuestions < minQuestions) {
    const swapped = minQuestions;
    minQuestions = maxQuestions;
    maxQuestions = swapped;
  }

  const status = safe.status ?? "all";

  return {
    name,
    platformId,
    subjectId,
    minQuestions,
    maxQuestions,
    status,
  };
};

export const fetchTopics = defineAction({
  input: z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(2000).default(10),
    filters: topicFiltersSchema.optional(),
    sort: topicSortSchema.optional(),
  }),
  async handler({ page, pageSize, filters, sort }) {
    const normalizedFilters = normalizeFilters(filters);
    const normalizedSort = sort ?? null;
    const conditions: SqlCondition[] = [];

    if (normalizedFilters.name) {
      conditions.push(sql`lower(${Topic.name}) LIKE ${`%${normalizedFilters.name.toLowerCase()}%`}`);
    }

    if (normalizedFilters.platformId !== null) {
      conditions.push(eq(Topic.platformId, normalizedFilters.platformId));
    }

    if (normalizedFilters.subjectId !== null) {
      conditions.push(eq(Topic.subjectId, normalizedFilters.subjectId));
    }

    if (normalizedFilters.minQuestions !== null) {
      conditions.push(gte(Topic.qCount, normalizedFilters.minQuestions));
    }

    if (normalizedFilters.maxQuestions !== null) {
      conditions.push(lte(Topic.qCount, normalizedFilters.maxQuestions));
    }

    if (normalizedFilters.status === "active") {
      conditions.push(eq(Topic.isActive, true));
    } else if (normalizedFilters.status === "inactive") {
      conditions.push(eq(Topic.isActive, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumnMap: Record<TopicSortInput["column"], any> = {
      id: Topic.id,
      name: Topic.name,
      subjectId: Topic.subjectId,
      platformId: Topic.platformId,
      subjectName: Subject.name,
      platformName: Platform.name,
      qCount: Topic.qCount,
      status: Topic.isActive,
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
      orderExpressions.push(asc(Topic.id));
    }

    const result = await topicQueryRepository.getPaginatedData({
      page,
      pageSize,
      where: () => whereClause,
      orderBy: () => orderExpressions,
    });

    const items = result.data.map(({ topic, subjectName, platformName }) =>
      normalizeTopic({ ...topic, subjectName: subjectName ?? null, platformName: platformName ?? null }),
    );

    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  },
});

export const createTopic = defineAction({
  input: topicPayloadSchema,
  async handler(input) {
    const payload = normalizeInput(input);

    const platform = await platformRepository.getById((table) => table.id, payload.platformId);

    if (!platform) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Platform not found" });
    }

    const subjectRow = await subjectRepository.getById((table) => table.id, payload.subjectId);

    if (!subjectRow) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Subject not found" });
    }

    if (subjectRow.platformId !== payload.platformId) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Subject does not belong to the selected platform",
      });
    }

    try {
      const inserted = await topicRepository.insert({
        platformId: payload.platformId,
        subjectId: payload.subjectId,
        name: payload.name,
        isActive: payload.isActive,
        qCount: payload.qCount,
      });

      const record = inserted?.[0];
      if (!record) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Unable to create topic" });
      }

      const enriched = await topicQueryRepository.getById((table) => table.id, record.id);
      const result =
        enriched ??
        ({
          topic: record,
          subjectName: subjectRow.name ?? null,
          platformName: platform.name ?? null,
        } as const);

      return normalizeTopic({
        ...result.topic,
        subjectName: result.subjectName ?? null,
        platformName: result.platformName ?? null,
      });
    } catch (err: unknown) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: (err as Error)?.message ?? "Unable to create topic",
      });
    }
  },
});

export const updateTopic = defineAction({
  input: topicPayloadSchema.extend({
    id: z.number().int().min(1, "Topic id is required"),
  }),
  async handler(input) {
    const payload = normalizeInput(input);
    const { id } = input;

    const platform = await platformRepository.getById((table) => table.id, payload.platformId);

    if (!platform) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Platform not found" });
    }

    const subjectRow = await subjectRepository.getById((table) => table.id, payload.subjectId);

    if (!subjectRow) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Subject not found" });
    }

    if (subjectRow.platformId !== payload.platformId) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Subject does not belong to the selected platform",
      });
    }

    const updated = await topicRepository.update(
      {
        platformId: payload.platformId,
        subjectId: payload.subjectId,
        name: payload.name,
        isActive: payload.isActive,
        qCount: payload.qCount,
      },
      (table) => eq(table.id, id),
    );

    const record = updated?.[0];
    if (!record) {
      throw new ActionError({ code: "NOT_FOUND", message: "Topic not found" });
    }

    const enriched = await topicQueryRepository.getById((table) => table.id, record.id);
    const result =
      enriched ??
      ({
        topic: record,
        subjectName: subjectRow.name ?? null,
        platformName: platform.name ?? null,
      } as const);

    return normalizeTopic({
      ...result.topic,
      subjectName: result.subjectName ?? null,
      platformName: result.platformName ?? null,
    });
  },
});

export const deleteTopic = defineAction({
  input: z.object({
    id: z.number().int().min(1, "Topic id is required"),
  }),
  async handler({ id }) {
    const deleted = await topicRepository.delete((table) => eq(table.id, id));

    if (!deleted?.[0]) {
      throw new ActionError({ code: "NOT_FOUND", message: "Topic not found" });
    }

    return { ok: true };
  },
});
