// db/tables.ts
import { column, defineTable, NOW } from "astro:db";

/**
 * A quiz created by a user.
 * Example: "JavaScript Basics – Level 1"
 */
export const Quizzes = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    // Owner of the quiz (parent app Users.id as string)
    ownerId: column.text(),

    title: column.text(),
    description: column.text({ optional: true }),

    // Optional meta
    slug: column.text({ optional: true }),
    visibility: column.text({
      enum: ["private", "unlisted", "public"],
      default: "private",
    }),

    // Optional quiz settings
    timeLimitSeconds: column.number({ optional: true }), // e.g. 900 = 15 minutes
    totalMarks: column.number({ optional: true }),

    isActive: column.boolean({ default: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * Questions belonging to a quiz.
 */
export const QuizQuestions = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    quizId: column.number({ references: () => Quizzes.columns.id }),

    // Order in quiz
    displayOrder: column.number({ default: 0 }),

    // Question type: single choice, multiple, true/false, short text, etc.
    type: column.text({
      enum: ["single_choice", "multiple_choice", "true_false", "short_text"],
      default: "single_choice",
    }),

    // Question text
    question: column.text(),

    // Options stored as JSON, e.g. [{ id: "A", label: "..." }, ...]
    options: column.json({ optional: true }),

    // Correct answer:
    // - for single: "A"
    // - for multiple: ["A","C"]
    // - for true/false: "true"
    // - for short_text: text or pattern
    correctAnswer: column.json({ optional: true }),

    explanation: column.text({ optional: true }),

    // Difficulty same as your old schema: E/M/D
    level: column.text({
      enum: ["E", "M", "D"],
      default: "E",
    }),

    marks: column.number({ default: 1 }),
    isActive: column.boolean({ default: true }),
  },
});

/**
 * A user taking a quiz once.
 */
export const QuizAttempts = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    quizId: column.number({ references: () => Quizzes.columns.id }),

    // The learner / taker (parent Users.id)
    userId: column.text({ optional: true }),

    // Attempt meta
    startedAt: column.date({ default: NOW }),
    completedAt: column.date({ optional: true }),

    score: column.number({ default: 0 }),
    maxScore: column.number({ default: 0 }),
    totalQuestions: column.number({ default: 0 }),

    // Optional JSON for extra stats: accuracy, time per question, etc.
    summary: column.json({ optional: true }),
  },
});

/**
 * Per-question response inside an attempt.
 */
export const QuizResponses = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    attemptId: column.number({ references: () => QuizAttempts.columns.id }),
    questionId: column.number({ references: () => QuizQuestions.columns.id }),

    // What the user selected / typed
    answer: column.json({ optional: true }),

    isCorrect: column.boolean({ default: false }),
    marksAwarded: column.number({ default: 0 }),
  },
});

export const quizTables = {
  Quizzes,
  QuizQuestions,
  QuizAttempts,
  QuizResponses,
} as const;
