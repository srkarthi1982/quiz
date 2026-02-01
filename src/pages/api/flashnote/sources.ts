import type { APIRoute } from "astro";
import { Platform, Roadmap, Subject, Topic, and, db, eq, sql } from "astro:db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../../lib/auth";

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

const normalizeQuery = (value?: string | null) => (value ?? "").toString().trim();

const formatContext = (parts: Array<string | null | undefined>) =>
  parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" → ");

export const GET: APIRoute = async ({ cookies, request }) => {
  const token = resolveToken(cookies, request.headers.get("authorization"));
  const session = token ? verifySessionToken(token) : null;

  if (!session?.userId) {
    return json(401, { error: "Unauthorized" });
  }

  const url = new URL(request.url);
  const query = normalizeQuery(url.searchParams.get("q"));

  if (query.length < 2) {
    return json(200, { roadmaps: [], topics: [], subjects: [], platforms: [] });
  }

  const needle = `%${query.toLowerCase()}%`;

  const platforms = await db
    .select({
      id: Platform.id,
      label: Platform.name,
    })
    .from(Platform)
    .where(and(eq(Platform.isActive, true), sql`lower(${Platform.name}) LIKE ${needle}`))
    .limit(5);

  const subjects = await db
    .select({
      id: Subject.id,
      label: Subject.name,
      platformName: Platform.name,
    })
    .from(Subject)
    .leftJoin(Platform, eq(Subject.platformId, Platform.id))
    .where(and(eq(Subject.isActive, true), sql`lower(${Subject.name}) LIKE ${needle}`))
    .limit(5);

  const topics = await db
    .select({
      id: Topic.id,
      label: Topic.name,
      platformName: Platform.name,
      subjectName: Subject.name,
    })
    .from(Topic)
    .leftJoin(Platform, eq(Topic.platformId, Platform.id))
    .leftJoin(Subject, eq(Topic.subjectId, Subject.id))
    .where(and(eq(Topic.isActive, true), sql`lower(${Topic.name}) LIKE ${needle}`))
    .limit(5);

  const roadmaps = await db
    .select({
      id: Roadmap.id,
      label: Roadmap.name,
      platformName: Platform.name,
      subjectName: Subject.name,
      topicName: Topic.name,
    })
    .from(Roadmap)
    .leftJoin(Platform, eq(Roadmap.platformId, Platform.id))
    .leftJoin(Subject, eq(Roadmap.subjectId, Subject.id))
    .leftJoin(Topic, eq(Roadmap.topicId, Topic.id))
    .where(and(eq(Roadmap.isActive, true), sql`lower(${Roadmap.name}) LIKE ${needle}`))
    .limit(5);

  return json(200, {
    roadmaps: roadmaps.map((item) => ({
      type: "roadmap",
      id: String(item.id),
      label: item.label,
      contextLabel: formatContext([item.platformName, item.subjectName, item.topicName]),
    })),
    topics: topics.map((item) => ({
      type: "topic",
      id: String(item.id),
      label: item.label,
      contextLabel: formatContext([item.platformName, item.subjectName]),
    })),
    subjects: subjects.map((item) => ({
      type: "subject",
      id: String(item.id),
      label: item.label,
      contextLabel: formatContext([item.platformName]),
    })),
    platforms: platforms.map((item) => ({
      type: "platform",
      id: String(item.id),
      label: item.label,
    })),
  });
};

export const POST: APIRoute = async () => json(405, { error: "Method Not Allowed" });
