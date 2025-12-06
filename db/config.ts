import { defineDb } from "astro:db";
import { Quizzes, QuizQuestions, QuizAttempts, QuizResponses } from "./tables";

// https://astro.build/db/config
export default defineDb({
  tables: {
    Quizzes,
    QuizQuestions,
    QuizAttempts,
    QuizResponses,
  },
});
