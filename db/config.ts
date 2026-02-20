import { defineDb } from "astro:db";
import { Bookmark, Faq, Platform, Question, QuestionVerification, Result, Roadmap, Subject, Topic } from "./tables";

// https://astro.build/db/config
export default defineDb({
  tables: {
    Platform,
    Subject,
    Topic,
    Roadmap,
    Question,
    QuestionVerification,
    Result,
    Bookmark,
    Faq,
  },
});
