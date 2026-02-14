import type { APIRoute } from "astro";
import { Question, QuestionVerification, and, db, eq, inArray } from "astro:db";
import { z } from "astro:schema";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../../../lib/auth";

const MAX_PER_CALL = 3;
const FEATURE_KEY = "quiz.question_verification_v1";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const requestSchema = z.object({
  questionIds: z.array(z.string()).min(1).max(50),
  context: z
    .object({
      platformId: z.string().optional(),
      topicId: z.string().optional(),
      levelId: z.string().optional(),
    })
    .optional(),
});

const aiSuggestSchema = z.object({
  suggestions: z.array(z.string()),
});

const verificationSchema = z.object({
  status: z.enum(["verified", "flagged", "unsure"]),
  reason: z.string().min(1),
  suggestedCorrect: z
    .object({
      choiceIndex: z.number().int().min(0),
      choiceText: z.string().min(1),
    })
    .nullable(),
  notes: z.string().optional(),
});

type VerificationStatus = z.infer<typeof verificationSchema>["status"];

const normalizeOptions = (value: unknown) => {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const answerIndexFromKey = (options: string[], answerKey?: string | null) => {
  const key = typeof answerKey === "string" ? answerKey.trim() : "";
  if (!key) return -1;

  const numeric = Number.parseInt(key, 10);
  if (!Number.isNaN(numeric)) {
    if (numeric >= 0 && numeric < options.length) return numeric;
    const zeroBased = numeric - 1;
    if (zeroBased >= 0 && zeroBased < options.length) return zeroBased;
  }

  if (key.length === 1) {
    const index = key.toLowerCase().charCodeAt(0) - 97;
    if (index >= 0 && index < options.length) return index;
  }

  const lowered = key.toLowerCase();
  const index = options.findIndex((option) => option.toLowerCase() === lowered);
  return index;
};

const toLimitedText = (value: string, max = 1700) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
};

const buildUserText = (
  question: {
    id: number;
    q: string;
    o: unknown;
    a: string;
    e: string;
  },
  context?: {
    platformId?: string;
    topicId?: string;
    levelId?: string;
  },
) => {
  const options = normalizeOptions(question.o);
  const indexedOptions = options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join("\n");
  const answerIndex = answerIndexFromKey(options, question.a);
  const answerText = answerIndex >= 0 ? options[answerIndex] : "Unknown";

  const raw = [
    `Question ID: ${question.id}`,
    context?.platformId ? `Platform ID: ${context.platformId}` : "",
    context?.topicId ? `Topic ID: ${context.topicId}` : "",
    context?.levelId ? `Level: ${context.levelId}` : "",
    `Question: ${question.q || ""}`,
    "Choices:",
    indexedOptions || "(none)",
    `Stored correct key/index: ${question.a || ""}`,
    `Stored correct text: ${answerText}`,
    `Explanation: ${question.e || ""}`,
    'Return JSON only with schema: {"status":"verified|flagged|unsure","reason":"...","suggestedCorrect":{"choiceIndex":0,"choiceText":"..."}|null,"notes":"..."}.',
  ]
    .filter(Boolean)
    .join("\n");

  return toLimitedText(raw);
};

const callLocalAiSuggest = async (request: Request, payload: { featureKey: string; userText: string }) => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const response = await fetch(new URL("/api/ai/suggest", request.url), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  return { response, body };
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  if (!session?.userId) {
    return json(401, { error: "Unauthorized.", code: "UNAUTHORIZED" });
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body.", code: "INVALID_JSON" });
  }

  const parsedRequest = requestSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    return json(400, { error: "Invalid request payload.", code: "INVALID_PAYLOAD" });
  }

  const ids = Array.from(
    new Set(
      parsedRequest.data.questionIds
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isFinite(value) && value > 0),
    ),
  );

  if (ids.length === 0) {
    return json(400, { error: "No valid question IDs.", code: "NO_VALID_IDS" });
  }

  const candidates = await db
    .select()
    .from(Question)
    .where(and(inArray(Question.id, ids), eq(Question.verificationStatus, "unverified")))
    .limit(MAX_PER_CALL);

  const results: Array<{ questionId: string; status: VerificationStatus }> = [];

  for (const question of candidates) {
    const checkedAt = new Date();
    const attempts = (Number(question.verificationAttempts) || 0) + 1;

    let status: VerificationStatus = "unsure";
    let payloadJson = "{}";
    let reason: string | null = null;
    let suggestedChoiceIndex: number | null = null;
    let suggestedChoiceText: string | null = null;

    try {
      const userText = buildUserText(question, parsedRequest.data.context);
      const upstream = await callLocalAiSuggest(request, {
        featureKey: FEATURE_KEY,
        userText,
      });

      if (!upstream.response.ok) {
        payloadJson = JSON.stringify({
          status: "unsure",
          reason: `Gateway request failed (${upstream.response.status}).`,
          suggestedCorrect: null,
          notes: "Gateway request failure",
        });
        reason = `Gateway request failed (${upstream.response.status}).`;
      } else {
        const aiBody = aiSuggestSchema.safeParse(upstream.body);
        const suggestion = aiBody.success ? aiBody.data.suggestions?.[0] : "";
        try {
          const parsedSuggestion = verificationSchema.parse(JSON.parse(suggestion || "{}"));
          status = parsedSuggestion.status;
          reason = parsedSuggestion.reason;
          suggestedChoiceIndex =
            parsedSuggestion.suggestedCorrect?.choiceIndex ?? null;
          suggestedChoiceText =
            parsedSuggestion.suggestedCorrect?.choiceText ?? null;
          payloadJson = JSON.stringify(parsedSuggestion);
        } catch {
          status = "unsure";
          reason = "Unable to parse verifier output.";
          payloadJson = JSON.stringify({
            status: "unsure",
            reason,
            suggestedCorrect: null,
            notes: "Raw suggestion could not be parsed",
            rawSuggestion: suggestion || null,
          });
        }
      }
    } catch {
      status = "unsure";
      reason = "Verification request failed.";
      payloadJson = JSON.stringify({
        status,
        reason,
        suggestedCorrect: null,
      });
    }

    await db
      .update(Question)
      .set({
        verificationStatus: status,
        verificationCheckedAt: checkedAt,
        verificationPayloadJson: payloadJson,
        verificationReason: reason,
        verificationSuggestedChoiceIndex: suggestedChoiceIndex,
        verificationSuggestedChoiceText: suggestedChoiceText,
        verificationModel: "ai-gateway-v1",
        verificationAttempts: attempts,
      })
      .where(eq(Question.id, question.id));

    await db.insert(QuestionVerification).values({
      questionId: question.id,
      status,
      payloadJson,
      model: "ai-gateway-v1",
      userId: session.userId,
    });

    results.push({ questionId: String(question.id), status });
  }

  return json(200, {
    ok: true,
    processed: results.length,
    results,
  });
};

export const GET: APIRoute = async () =>
  json(405, { error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" });
