import { seedPlatforms } from "./seeds/platform";
import { seedRoadmaps } from "./seeds/roadmap";
import { seedSubjects } from "./seeds/subject";
import { seedTopics } from "./seeds/topic";

// https://astro.build/db/seed
export default async function seed() {
  await seedPlatforms();
  await seedSubjects();
  await seedTopics();
  await seedRoadmaps();
}
