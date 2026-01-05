import { Roadmap, db } from "astro:db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

type RoadmapSeedInput = {
  id: number;
  platform_id: number;
  subject_id: number;
  topic_id: number;
  name: string;
  is_active: boolean;
  q_count: number;
};

export const seedRoadmaps = async () => {
  const filePath = join(process.cwd(), "db", "seeds", "roadmap.json");
  const raw = await readFile(filePath, "utf-8");
  const data = JSON.parse(raw) as RoadmapSeedInput[];

  const records = data.map((item) => ({
    id: item.id,
    platformId: item.platform_id,
    subjectId: item.subject_id,
    topicId: item.topic_id,
    name: item.name,
    isActive: item.is_active,
    qCount: item.q_count,
  }));

  const chunkSize = 500;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    await db.insert(Roadmap).values(chunk);
  }
};

export default async function seed() {
  await seedRoadmaps();
}
