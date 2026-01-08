import type { Alpine } from "alpinejs";
import { registerAdminPlatformsStore } from "./stores/adminPlatforms";
import { registerAdminQuestionsStore } from "./stores/adminQuestions";
import { registerAdminSubjectsStore } from "./stores/adminSubjects";
import { registerAdminTopicsStore } from "./stores/adminTopics";
import { registerAdminRoadmapsStore } from "./stores/adminRoadmaps";
import { registerQuizStore } from "./stores/quiz";

export default function initAlpine(Alpine: Alpine) {
  registerAdminPlatformsStore(Alpine);
  registerAdminQuestionsStore(Alpine);
  registerAdminSubjectsStore(Alpine);
  registerAdminTopicsStore(Alpine);
  registerAdminRoadmapsStore(Alpine);
  registerQuizStore(Alpine);

  if (typeof window !== "undefined") {
    window.Alpine = Alpine;
  }
}
