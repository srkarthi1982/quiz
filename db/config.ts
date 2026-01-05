import { defineDb } from "astro:db";
import { Platform, Question, Result, Roadmap, Subject, Topic } from "./tables";

// https://astro.build/db/config
export default defineDb({
  tables: {
    Platform,
    Subject,
    Topic,
    Roadmap,
    Question,
    Result,
  },
});
