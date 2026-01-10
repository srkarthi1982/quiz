import { Question, db } from "astro:db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

type QuestionSeedInput = {
  id?: number;
  platform_id: number;
  subject_id: number;
  topic_id: number;
  roadmap_id: number;
  q: string;
  o: string[];
  a: string | number;
  e: string;
  l: "E" | "M" | "D";
  is_active: boolean;
};

export const seedQuestions = async () => {
  const filePath = join(process.cwd(), "public", "53-School.json");
  const raw = await readFile(filePath, "utf-8");
  const data = JSON.parse(raw) as QuestionSeedInput[];

  const records = data.map((item) => ({
    platformId: item.platform_id,
    subjectId: item.subject_id,
    topicId: item.topic_id,
    roadmapId: item.roadmap_id,
    q: item.q ?? "",
    o: Array.isArray(item.o) ? item.o : [],
    a: typeof item.a === "number" ? String(item.a) : item.a ?? "",
    e: item.e ?? "",
    l: item.l,
    isActive: item.is_active,
  }));

  const chunkSize = 500;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    await db.insert(Question).values(chunk);
  }
};

export default async function seed() {
  await seedQuestions();
}
