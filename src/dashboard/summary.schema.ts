import { Platform, Result, Roadmap, Subject, Topic, and, count, db, desc, eq, gte, inArray } from "astro:db";

export type QuizDashboardSummaryV1 = {
  version: 1;
  appId: "quiz";
  userId: string;
  updatedAt: string;
  kpis: {
    attemptsTotal: number;
    attemptsLast7d: number;
    avgScorePctAllTime: number;
    bestScorePctAllTime: number;
    lastAttemptAt: string | null;
  };
  recentAttempts: Array<{
    id: number;
    createdAt: string;
    platformName: string;
    subjectName: string;
    topicName: string;
    roadmapName: string;
    level: "E" | "M" | "D" | null;
    score: { mark: number; total: number; pct: number };
  }>;
  topRoadmaps: Array<{
    roadmapId: number;
    roadmapName: string;
    attempts: number;
    avgScorePct: number;
  }>;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

const scorePct = (mark: number, total: number) => {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return round1((mark / total) * 100);
};

const normalizeMark = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeTotal = (value: unknown) => {
  if (Array.isArray(value)) return value.length;
  return 0;
};

export const buildQuizDashboardSummary = async (userId: string): Promise<QuizDashboardSummaryV1> => {
  const updatedAt = new Date().toISOString();
  const userIdString = userId;

  const [{ value: attemptsTotalRaw } = { value: 0 }] = await db
    .select({ value: count() })
    .from(Result)
    .where(eq(Result.userId, userIdString));

  const attemptsTotal = Number(attemptsTotalRaw ?? 0);

  const last7dThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [{ value: attemptsLast7dRaw } = { value: 0 }] = await db
    .select({ value: count() })
    .from(Result)
    .where(and(eq(Result.userId, userIdString), gte(Result.createdAt, last7dThreshold)));
  const attemptsLast7d = Number(attemptsLast7dRaw ?? 0);

  const lastAttemptRow = await db
    .select({ createdAt: Result.createdAt })
    .from(Result)
    .where(eq(Result.userId, userIdString))
    .orderBy(desc(Result.createdAt), desc(Result.id))
    .limit(1);
  const lastAttemptAt =
    lastAttemptRow?.[0]?.createdAt instanceof Date
      ? lastAttemptRow[0].createdAt.toISOString()
      : lastAttemptRow?.[0]?.createdAt
        ? new Date(lastAttemptRow[0].createdAt).toISOString()
        : null;

  const scoreRows = await db
    .select({ mark: Result.mark, responses: Result.responses, roadmapId: Result.roadmapId })
    .from(Result)
    .where(eq(Result.userId, userIdString));

  let totalPctSum = 0;
  let bestPct = 0;
  const roadmapStats = new Map<number, { attempts: number; pctSum: number }>();

  scoreRows.forEach((row) => {
    const mark = normalizeMark(row.mark);
    const total = normalizeTotal(row.responses);
    const pct = scorePct(mark, total);
    totalPctSum += pct;
    if (pct > bestPct) bestPct = pct;

    const roadmapId = Number(row.roadmapId);
    if (Number.isFinite(roadmapId)) {
      const existing = roadmapStats.get(roadmapId) ?? { attempts: 0, pctSum: 0 };
      existing.attempts += 1;
      existing.pctSum += pct;
      roadmapStats.set(roadmapId, existing);
    }
  });

  const avgScorePctAllTime = attemptsTotal > 0 ? round1(totalPctSum / attemptsTotal) : 0;
  const bestScorePctAllTime = round1(bestPct);

  const recentRows = await db
    .select({
      id: Result.id,
      createdAt: Result.createdAt,
      platformId: Result.platformId,
      subjectId: Result.subjectId,
      topicId: Result.topicId,
      roadmapId: Result.roadmapId,
      level: Result.level,
      mark: Result.mark,
      responses: Result.responses,
    })
    .from(Result)
    .where(eq(Result.userId, userIdString))
    .orderBy(desc(Result.createdAt), desc(Result.id))
    .limit(5);

  const platformIds = new Set<number>();
  const subjectIds = new Set<number>();
  const topicIds = new Set<number>();
  const roadmapIds = new Set<number>();

  recentRows.forEach((row) => {
    if (Number.isFinite(row.platformId)) platformIds.add(Number(row.platformId));
    if (Number.isFinite(row.subjectId)) subjectIds.add(Number(row.subjectId));
    if (Number.isFinite(row.topicId)) topicIds.add(Number(row.topicId));
    if (Number.isFinite(row.roadmapId)) roadmapIds.add(Number(row.roadmapId));
  });
  roadmapStats.forEach((_stat, roadmapId) => {
    if (Number.isFinite(roadmapId)) roadmapIds.add(roadmapId);
  });

  const platformRows =
    platformIds.size > 0
      ? await db
          .select({ id: Platform.id, name: Platform.name })
          .from(Platform)
          .where(inArray(Platform.id, Array.from(platformIds)))
      : [];

  const subjectRows =
    subjectIds.size > 0
      ? await db
          .select({ id: Subject.id, name: Subject.name })
          .from(Subject)
          .where(inArray(Subject.id, Array.from(subjectIds)))
      : [];

  const topicRows =
    topicIds.size > 0
      ? await db
          .select({ id: Topic.id, name: Topic.name })
          .from(Topic)
          .where(inArray(Topic.id, Array.from(topicIds)))
      : [];

  const roadmapRows =
    roadmapIds.size > 0
      ? await db
          .select({ id: Roadmap.id, name: Roadmap.name })
          .from(Roadmap)
          .where(inArray(Roadmap.id, Array.from(roadmapIds)))
      : [];

  const platformMap = new Map(platformRows.map((row) => [row.id, row.name ?? `Platform ${row.id}`]));
  const subjectMap = new Map(subjectRows.map((row) => [row.id, row.name ?? `Subject ${row.id}`]));
  const topicMap = new Map(topicRows.map((row) => [row.id, row.name ?? `Topic ${row.id}`]));
  const roadmapMap = new Map(roadmapRows.map((row) => [row.id, row.name ?? `Roadmap ${row.id}`]));

  const recentAttempts = recentRows.map((row) => {
    const total = normalizeTotal(row.responses);
    const mark = normalizeMark(row.mark);
    const pct = scorePct(mark, total);
    const createdAt =
      row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt ?? Date.now()).toISOString();

    return {
      id: Number(row.id),
      createdAt,
      platformName: platformMap.get(Number(row.platformId)) ?? `Platform ${row.platformId}`,
      subjectName: subjectMap.get(Number(row.subjectId)) ?? `Subject ${row.subjectId}`,
      topicName: topicMap.get(Number(row.topicId)) ?? `Topic ${row.topicId}`,
      roadmapName: roadmapMap.get(Number(row.roadmapId)) ?? `Roadmap ${row.roadmapId}`,
      level: (row.level ?? null) as "E" | "M" | "D" | null,
      score: { mark, total, pct },
    };
  });

  const topRoadmaps = Array.from(roadmapStats.entries())
    .map(([roadmapId, stat]) => ({
      roadmapId,
      roadmapName: roadmapMap.get(roadmapId) ?? `Roadmap ${roadmapId}`,
      attempts: stat.attempts,
      avgScorePct: stat.attempts > 0 ? round1(stat.pctSum / stat.attempts) : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 5);

  return {
    version: 1,
    appId: "quiz",
    userId,
    updatedAt,
    kpis: {
      attemptsTotal,
      attemptsLast7d,
      avgScorePctAllTime,
      bestScorePctAllTime,
      lastAttemptAt,
    },
    recentAttempts,
    topRoadmaps,
  };
};
