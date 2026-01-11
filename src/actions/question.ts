import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { Platform, Question, Roadmap, Subject, Topic, and, asc, count, db, desc, eq, sql } from "astro:db";
import {
  platformRepository,
  questionQueryRepository,
  questionRepository,
  roadmapRepository,
  subjectRepository,
  topicRepository,
} from "./repositories";
import { requireAdmin, requireUser } from "./_guards";

type SqlCondition = NonNullable<Parameters<typeof and>[number]>;
type QuestionRow = typeof Question.$inferSelect;

const normalizeArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "number" || typeof item === "boolean") return String(item);
        return "";
      })
      .filter((item) => item.length > 0);
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "number" || typeof item === "boolean") return String(item);
        try {
          return JSON.stringify(item);
        } catch {
          return "";
        }
      })
      .filter((item) => item.length > 0);
  }

  return [];
};

const deriveAnswerFromKey = (options: string[], answerKey?: string | null): string | null => {
  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }

  const key = typeof answerKey === "string" ? answerKey.trim() : "";
  if (!key) {
    return null;
  }

  const numericKey = Number.parseInt(key, 10);
  if (!Number.isNaN(numericKey)) {
    if (numericKey >= 0 && numericKey < options.length) {
      return options[numericKey];
    }
    const zeroBased = numericKey - 1;
    if (zeroBased >= 0 && zeroBased < options.length) {
      return options[zeroBased];
    }
  }

  if (key.length === 1) {
    const alphaIndex = key.toLowerCase().charCodeAt(0) - 97;
    if (alphaIndex >= 0 && alphaIndex < options.length) {
      return options[alphaIndex];
    }
  }

  const loweredKey = key.toLowerCase();
  for (const option of options) {
    if (option.trim().toLowerCase() === loweredKey) {
      return option;
    }
  }

  return null;
};

const normalizeQuestion = (
  row: QuestionRow & {
    platformName?: string | null;
    subjectName?: string | null;
    topicName?: string | null;
    roadmapName?: string | null;
  },
) => {
  const options = normalizeArray(row.o);
  const rawAnswerKey = typeof row.a === "string" ? row.a.trim() : "";
  const answerKey = rawAnswerKey.length > 0 ? rawAnswerKey : "0";
  const explanation = typeof row.e === "string" ? row.e.trim() : "";
  const levelRaw = typeof row.l === "string" ? row.l.trim().toUpperCase() : "E";
  const level: "E" | "M" | "D" = levelRaw === "M" || levelRaw === "D" ? levelRaw : "E";

  return {
    id: row.id,
    platformId: row.platformId,
    subjectId: row.subjectId,
    topicId: row.topicId,
    roadmapId: row.roadmapId ?? null,
    questionText: row.q,
    options,
    answer: deriveAnswerFromKey(options, answerKey),
    answerKey,
    explanation,
    level,
    isActive: Boolean(row.isActive),
    platformName: row.platformName ?? null,
    subjectName: row.subjectName ?? null,
    topicName: row.topicName ?? null,
    roadmapName: row.roadmapName ?? null,
  };
};

const questionPayloadSchema = z.object({
  platformId: z.number().int().min(1, "Platform is required"),
  subjectId: z.number().int().min(1, "Subject is required"),
  topicId: z.number().int().min(1, "Topic is required"),
  roadmapId: z.number().int().min(1, "Roadmap is required"),
  questionText: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(1, "At least one option is required"),
  answerKey: z.string().min(1, "Answer key is required"),
  explanation: z.string().min(1, "Explanation is required"),
  level: z.enum(["E", "M", "D"]),
  isActive: z.boolean().optional(),
});

const questionFiltersSchema = z.object({
  questionText: z.string().optional(),
  platformId: z.number().int().min(1).optional(),
  subjectId: z.number().int().min(1).optional(),
  topicId: z.number().int().min(1).optional(),
  roadmapId: z.number().int().min(1).optional(),
  level: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).optional(),
});

type QuestionFiltersInput = z.infer<typeof questionFiltersSchema>;

const questionSortSchema = z.object({
  column: z.enum([
    "questionText",
    "platformName",
    "subjectName",
    "topicName",
    "roadmapName",
    "platformId",
    "subjectId",
    "topicId",
    "roadmapId",
    "level",
    "status",
    "id",
  ]),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

type QuestionSortInput = z.infer<typeof questionSortSchema>;

const normalizeInput = (input: z.infer<typeof questionPayloadSchema>) => {
  const questionText = input.questionText.trim();
  if (!questionText) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Question text is required" });
  }

  const platformId = Math.floor(input.platformId);
  const subjectId = Math.floor(input.subjectId);
  const topicId = Math.floor(input.topicId);

  if (!Number.isFinite(platformId) || platformId <= 0) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Platform is required" });
  }
  if (!Number.isFinite(subjectId) || subjectId <= 0) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Subject is required" });
  }
  if (!Number.isFinite(topicId) || topicId <= 0) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Topic is required" });
  }

  const roadmapId = Math.floor(input.roadmapId);
  if (!Number.isFinite(roadmapId) || roadmapId <= 0) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Roadmap is required" });
  }

  const normalizeString = (value?: string | null) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const normalizeArrayField = (value?: string[]) => {
    if (!Array.isArray(value)) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Options are required" });
    }
    const items = value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
    if (items.length === 0) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Provide at least one option" });
    }
    return items;
  };

  const normalizeRequiredString = (value: string | null, field: string) => {
    const normalized = normalizeString(value);
    if (!normalized) {
      throw new ActionError({ code: "BAD_REQUEST", message: `${field} is required` });
    }
    return normalized;
  };

  const normalizeLevelField = (value?: string | null) => {
    const normalized = normalizeRequiredString(value ?? null, "Level");
    const upper = normalized.toUpperCase();
    if (upper !== "E" && upper !== "M" && upper !== "D") {
      throw new ActionError({ code: "BAD_REQUEST", message: "Level must be E, M, or D" });
    }
    return upper;
  };

  return {
    platformId,
    subjectId,
    topicId,
    roadmapId,
    questionText,
    options: normalizeArrayField(input.options),
    answerKey: normalizeRequiredString(input.answerKey ?? null, "Answer key"),
    explanation: normalizeRequiredString(input.explanation ?? null, "Explanation"),
    level: normalizeLevelField(input.level),
    isActive: input.isActive ?? true,
  } as const;
};

const normalizeFilters = (filters?: QuestionFiltersInput) => {
  const safe = filters ?? {};
  const toTrimmed = (value?: string | null) => value?.trim() ?? "";
  const questionText = toTrimmed(safe.questionText);
  const rawLevel = toTrimmed(safe.level).toUpperCase();
  const level = rawLevel === "E" || rawLevel === "M" || rawLevel === "D" ? rawLevel : "";

  const platformId =
    safe.platformId && Number.isFinite(safe.platformId) ? Math.floor(safe.platformId) : null;
  const subjectId =
    safe.subjectId && Number.isFinite(safe.subjectId) ? Math.floor(safe.subjectId) : null;
  const topicId = safe.topicId && Number.isFinite(safe.topicId) ? Math.floor(safe.topicId) : null;
  const roadmapId =
    safe.roadmapId && Number.isFinite(safe.roadmapId) ? Math.floor(safe.roadmapId) : null;

  const status = safe.status ?? "all";

  return {
    questionText,
    level,
    platformId,
    subjectId,
    topicId,
    roadmapId,
    status,
  };
};

export const fetchQuestions = defineAction({
  input: z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(48).default(10),
    filters: questionFiltersSchema.optional(),
    sort: questionSortSchema.optional(),
  }),
  async handler({ page, pageSize, filters, sort }, context: ActionAPIContext) {
    requireAdmin(context);
    const normalizedFilters = normalizeFilters(filters);
    const normalizedSort = sort ?? null;

    const conditions: SqlCondition[] = [];

    if (normalizedFilters.questionText) {
      conditions.push(
        sql`lower(${Question.q}) LIKE ${`%${normalizedFilters.questionText.toLowerCase()}%`}`,
      );
    }

    if (normalizedFilters.platformId !== null) {
      conditions.push(eq(Question.platformId, normalizedFilters.platformId));
    }

    if (normalizedFilters.subjectId !== null) {
      conditions.push(eq(Question.subjectId, normalizedFilters.subjectId));
    }

    if (normalizedFilters.topicId !== null) {
      conditions.push(eq(Question.topicId, normalizedFilters.topicId));
    }

    if (normalizedFilters.roadmapId !== null) {
      conditions.push(eq(Question.roadmapId, normalizedFilters.roadmapId));
    }

    if (normalizedFilters.level) {
      conditions.push(sql`upper(${Question.l}) = ${normalizedFilters.level.toUpperCase()}`);
    }

    if (normalizedFilters.status === "active") {
      conditions.push(eq(Question.isActive, true));
    } else if (normalizedFilters.status === "inactive") {
      conditions.push(eq(Question.isActive, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumnMap: Record<QuestionSortInput["column"], any> = {
      id: Question.id,
      questionText: Question.q,
      platformId: Question.platformId,
      subjectId: Question.subjectId,
      topicId: Question.topicId,
      roadmapId: Question.roadmapId,
      platformName: Platform.name,
      subjectName: Subject.name,
      topicName: Topic.name,
      roadmapName: Roadmap.name,
      level: Question.l,
      status: Question.isActive,
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
      orderExpressions.push(asc(Question.id));
    }

    const result = await questionQueryRepository.getPaginatedData({
      page,
      pageSize,
      where: () => whereClause,
      orderBy: () => orderExpressions,
    });

    const items = result.data.map(({ question, platformName, subjectName, topicName, roadmapName }) =>
      normalizeQuestion({
        ...question,
        platformName: platformName ?? null,
        subjectName: subjectName ?? null,
        topicName: topicName ?? null,
        roadmapName: roadmapName ?? null,
      }),
    );

    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  },
});

export const fetchRandomQuestions = defineAction({
  input: z.object({
    filters: questionFiltersSchema.optional(),
    excludeIds: z.array(z.number().int().min(1)).optional(),
  }),
  async handler({ filters, excludeIds }, context: ActionAPIContext) {
    requireUser(context);
    const normalizedFilters = normalizeFilters(filters);
    const normalizedExcludeIds = Array.isArray(excludeIds)
      ? Array.from(
          new Set(
            excludeIds
              .map((value) => (Number.isFinite(value) ? Math.floor(value) : Number.NaN))
              .filter((value) => Number.isFinite(value) && value > 0),
          ),
        )
      : [];

    const conditions: SqlCondition[] = [];

    if (normalizedFilters.questionText) {
      conditions.push(
        sql`lower(${Question.q}) LIKE ${`%${normalizedFilters.questionText.toLowerCase()}%`}`,
      );
    }

    if (normalizedFilters.platformId !== null) {
      conditions.push(eq(Question.platformId, normalizedFilters.platformId));
    }

    if (normalizedFilters.subjectId !== null) {
      conditions.push(eq(Question.subjectId, normalizedFilters.subjectId));
    }

    if (normalizedFilters.topicId !== null) {
      conditions.push(eq(Question.topicId, normalizedFilters.topicId));
    }

    if (normalizedFilters.roadmapId !== null) {
      conditions.push(eq(Question.roadmapId, normalizedFilters.roadmapId));
    }

    if (normalizedFilters.level) {
      conditions.push(sql`upper(${Question.l}) = ${normalizedFilters.level.toUpperCase()}`);
    }

    if (normalizedFilters.status === "active") {
      conditions.push(eq(Question.isActive, true));
    } else if (normalizedFilters.status === "inactive") {
      conditions.push(eq(Question.isActive, false));
    }

    normalizedExcludeIds.forEach((id) => {
      conditions.push(sql`${Question.id} != ${id}`);
    });

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const pageSize = 10;

    let countQuery = db.select({ value: count() }).from(Question);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const countResult = await countQuery;
    const rawTotal = countResult[0]?.value ?? 0;
    const total = typeof rawTotal === "number" ? rawTotal : Number(rawTotal);

    const rows = await questionQueryRepository.getData({
      where: () => whereClause,
      orderBy: () => [sql`random()`],
      limit: pageSize,
    });

    const items = rows.map(({ question, platformName, subjectName, topicName, roadmapName }) =>
      normalizeQuestion({
        ...question,
        platformName: platformName ?? null,
        subjectName: subjectName ?? null,
        topicName: topicName ?? null,
        roadmapName: roadmapName ?? null,
      }),
    );

    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

    return {
      items,
      total,
      page: 1,
      pageSize,
      totalPages,
      hasNextPage: total > pageSize,
      hasPreviousPage: false,
    };
  },
});

export const createQuestion = defineAction({
  input: questionPayloadSchema,
  async handler(input, context: ActionAPIContext) {
    requireAdmin(context);
    const payload = normalizeInput(input);

    const platformRow = await platformRepository.getById((table) => table.id, payload.platformId);

    if (!platformRow) {
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

    const topicRow = await topicRepository.getById((table) => table.id, payload.topicId);
    if (!topicRow) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Topic not found" });
    }

    if (topicRow.platformId !== payload.platformId || topicRow.subjectId !== payload.subjectId) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Topic does not align with the selected platform and subject",
      });
    }

    let roadmapRow: { id: number; name: string | null } | null = null;
    if (payload.roadmapId !== null) {
      const roadmap = await roadmapRepository.getById((table) => table.id, payload.roadmapId);
      if (!roadmap) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Roadmap not found" });
      }

      if (
        roadmap.platformId !== payload.platformId ||
        roadmap.subjectId !== payload.subjectId ||
        roadmap.topicId !== payload.topicId
      ) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Roadmap does not align with the selected platform, subject, and topic",
        });
      }
      roadmapRow = { id: roadmap.id, name: roadmap.name ?? null };
    }

    try {
      const inserted = await questionRepository.insert({
        platformId: payload.platformId,
        subjectId: payload.subjectId,
        topicId: payload.topicId,
        roadmapId: payload.roadmapId,
        q: payload.questionText,
        o: payload.options ?? null,
        a: payload.answerKey,
        e: payload.explanation,
        l: payload.level,
        isActive: payload.isActive,
      });

      const record = inserted?.[0];
      if (!record) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Unable to create question" });
      }

      const enriched = await questionQueryRepository.getById((table) => table.id, record.id);
      const result =
        enriched ??
        ({
          question: record,
          platformName: platformRow.name ?? null,
          subjectName: subjectRow.name ?? null,
          topicName: topicRow.name ?? null,
          roadmapName: roadmapRow?.name ?? null,
        } as const);

      return normalizeQuestion({
        ...result.question,
        platformName: result.platformName ?? null,
        subjectName: result.subjectName ?? null,
        topicName: result.topicName ?? null,
        roadmapName: result.roadmapName ?? null,
      });
    } catch (err: unknown) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: (err as Error)?.message ?? "Unable to create question",
      });
    }
  },
});

export const updateQuestion = defineAction({
  input: questionPayloadSchema.extend({
    id: z.number().int().min(1, "Question id is required"),
  }),
  async handler(input, context: ActionAPIContext) {
    requireAdmin(context);
    const payload = normalizeInput(input);
    const { id } = input;

    const platformRow = await platformRepository.getById((table) => table.id, payload.platformId);

    if (!platformRow) {
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

    const topicRow = await topicRepository.getById((table) => table.id, payload.topicId);
    if (!topicRow) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Topic not found" });
    }

    if (topicRow.platformId !== payload.platformId || topicRow.subjectId !== payload.subjectId) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "Topic does not align with the selected platform and subject",
      });
    }

    let roadmapRow: { id: number; name: string | null } | null = null;
    if (payload.roadmapId !== null) {
      const roadmap = await roadmapRepository.getById((table) => table.id, payload.roadmapId);
      if (!roadmap) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Roadmap not found" });
      }

      if (
        roadmap.platformId !== payload.platformId ||
        roadmap.subjectId !== payload.subjectId ||
        roadmap.topicId !== payload.topicId
      ) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Roadmap does not align with the selected platform, subject, and topic",
        });
      }
      roadmapRow = { id: roadmap.id, name: roadmap.name ?? null };
    }

    const updated = await questionRepository.update(
      {
        platformId: payload.platformId,
        subjectId: payload.subjectId,
        topicId: payload.topicId,
        roadmapId: payload.roadmapId,
        q: payload.questionText,
        o: payload.options ?? null,
        a: payload.answerKey,
        e: payload.explanation,
        l: payload.level,
        isActive: payload.isActive,
      },
      (table) => eq(table.id, id),
    );

    const record = updated?.[0];
    if (!record) {
      throw new ActionError({ code: "NOT_FOUND", message: "Question not found" });
    }

    const enriched = await questionQueryRepository.getById((table) => table.id, record.id);
    const result =
      enriched ??
      ({
        question: record,
        platformName: platformRow.name ?? null,
        subjectName: subjectRow.name ?? null,
        topicName: topicRow.name ?? null,
        roadmapName: roadmapRow?.name ?? null,
      } as const);

    return normalizeQuestion({
      ...result.question,
      platformName: result.platformName ?? null,
      subjectName: result.subjectName ?? null,
      topicName: result.topicName ?? null,
      roadmapName: result.roadmapName ?? null,
    });
  },
});

export const deleteQuestion = defineAction({
  input: z.object({
    id: z.number().int().min(1, "Question id is required"),
  }),
  async handler({ id }, context: ActionAPIContext) {
    requireAdmin(context);
    const deleted = await questionRepository.delete((table) => eq(table.id, id));

    if (!deleted?.[0]) {
      throw new ActionError({ code: "NOT_FOUND", message: "Question not found" });
    }

    return { ok: true } as const;
  },
});
