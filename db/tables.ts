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

    category: column.text({ optional: true }), // e.g. "JavaScript", "Biology"
    difficulty: column.text({ optional: true }), // e.g. "easy", "medium", "hard"

    timeLimitMinutes: column.number({ optional: true }),

    totalQuestions: column.number({ optional: true }),
    totalMarks: column.number({ optional: true }),

    isPublished: column.boolean({ default: false }),
    isArchived: column.boolean({ default: false }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * Individual questions inside a quiz.
 */
export const QuizQuestions = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    quizId: column.number({
      references: () => Quizzes.columns.id,
    }),

    orderIndex: column.number(), // 1-based order inside the quiz

    questionType: column.text({ optional: true }), // "single", "multi", "true_false", "free_text"
    questionText: column.text(),
    explanation: column.text({ optional: true }),

    // For multiple choice questions, store options as a JSON array of strings
    optionsJson: column.json({ optional: true }),

    // JSON describing correct answers (e.g. array of indices or text)
    correctAnswersJson: column.json({ optional: true }),

    marks: column.number({ default: 1 }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * A user's attempt at taking a quiz.
 */
export const QuizAttempts = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    quizId: column.number({
      references: () => Quizzes.columns.id,
    }),

    // Attempt owner (parent app Users.id as string)
    userId: column.text(),

    status: column.text({ optional: true }), // "in-progress", "completed", "abandoned"

    startedAt: column.date({ default: NOW }),
    completedAt: column.date({ optional: true }),

    totalQuestions: column.number({ optional: true }),
    correctCount: column.number({ optional: true }),

    totalMarks: column.number({ optional: true }),
    obtainedMarks: column.number({ optional: true }),

    metaJson: column.json({ optional: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * A user's response to a specific question in an attempt.
 */
export const QuizResponses = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    attemptId: column.number({
      references: () => QuizAttempts.columns.id,
    }),

    quizId: column.number({
      references: () => Quizzes.columns.id,
    }),

    questionId: column.number({
      references: () => QuizQuestions.columns.id,
    }),

    // What the user selected / typed (JSON for flexibility)
    answerJson: column.json({ optional: true }),

    isCorrect: column.boolean({ default: false }),
    marksAwarded: column.number({ default: 0 }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const quizTables = {
  Quizzes,
  QuizQuestions,
  QuizAttempts,
  QuizResponses,
} as const;
