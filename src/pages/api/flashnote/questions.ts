import type { APIRoute } from "astro";
import { Question, and, db, eq } from "astro:db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../../lib/auth";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

type SqlCondition = NonNullable<Parameters<typeof and>[number]>;

type QuestionRow = {
  id: number;
  q: string;
  o: unknown;
  a: string;
  e: string;
  l: string;
  topicId: number;
  subjectId: number;
  platformId: number;
  roadmapId: number;
};

const resolveToken = (cookies: APIRoute["prototype"]["cookies"], authHeader?: string | null) => {
  const cookieToken = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  if (!authHeader) return null;
  const [scheme, value] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  return value;
};

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

const toDifficulty = (value?: string | null) => {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (normalized === "E") return "easy";
  if (normalized === "M") return "medium";
  if (normalized === "D") return "hard";
  return null;
};

const parseFilterNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const parseLimit = (value: string | null) => {
  if (!value) return 50;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 50;
  return Math.min(parsed, 200);
};

export const GET: APIRoute = async ({ cookies, request }) => {
  const token = resolveToken(cookies, request.headers.get("authorization"));
  const session = token ? verifySessionToken(token) : null;

  if (!session?.userId) {
    return json(401, { error: "Unauthorized" });
  }

  const url = new URL(request.url);
  const quizId = parseFilterNumber(url.searchParams.get("quizId"));
  const roadmapId = parseFilterNumber(url.searchParams.get("roadmapId"));
  const topicId = parseFilterNumber(url.searchParams.get("topicId"));
  const subjectId = parseFilterNumber(url.searchParams.get("subjectId"));
  const platformId = parseFilterNumber(url.searchParams.get("platformId"));
  const limit = parseLimit(url.searchParams.get("limit"));

  const conditions: SqlCondition[] = [eq(Question.isActive, true)];

  if (roadmapId || quizId) {
    // FlashNote uses quizId; map it to roadmapId in the Quiz schema.
    conditions.push(eq(Question.roadmapId, roadmapId ?? quizId!));
  }

  if (topicId) {
    conditions.push(eq(Question.topicId, topicId));
  }

  if (subjectId) {
    conditions.push(eq(Question.subjectId, subjectId));
  }

  if (platformId) {
    conditions.push(eq(Question.platformId, platformId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: Question.id,
      q: Question.q,
      o: Question.o,
      a: Question.a,
      e: Question.e,
      l: Question.l,
      topicId: Question.topicId,
      subjectId: Question.subjectId,
      platformId: Question.platformId,
      roadmapId: Question.roadmapId,
    })
    .from(Question)
    .where(whereClause)
    .limit(limit);

  const items = rows.map((row: QuestionRow) => {
    const options = normalizeArray(row.o);
    const rawAnswerKey = typeof row.a === "string" ? row.a.trim() : "";
    const answerText = deriveAnswerFromKey(options, rawAnswerKey) ?? rawAnswerKey;
    const explanation = typeof row.e === "string" ? row.e.trim() : "";

    return {
      questionId: String(row.id),
      questionText: row.q,
      answerText,
      explanation: explanation.length > 0 ? explanation : null,
      topicId: row.topicId ? String(row.topicId) : null,
      subjectId: row.subjectId ? String(row.subjectId) : null,
      platformId: row.platformId ? String(row.platformId) : null,
      roadmapId: row.roadmapId ? String(row.roadmapId) : null,
      difficulty: toDifficulty(row.l),
    };
  });

  return json(200, { items });
};

export const POST: APIRoute = async () => json(405, { error: "Method Not Allowed" });
