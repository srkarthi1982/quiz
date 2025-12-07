import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import {
  db,
  eq,
  and,
  Quizzes,
  QuizQuestions,
  QuizAttempts,
  QuizResponses,
} from "astro:db";

/**
 * Helper to require an authenticated user from middleware.
 */
function requireUser(context: import("astro:actions").ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;
  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }
  return user;
}

export const server = {
  /**
   * Create a new quiz owned by the current user.
   */
  createQuiz: defineAction({
    input: z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      category: z.string().optional(),
      difficulty: z.string().optional(),
      timeLimitMinutes: z.number().int().positive().optional(),
      totalQuestions: z.number().int().positive().optional(),
      totalMarks: z.number().int().positive().optional(),
      isPublished: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [quiz] = await db
        .insert(Quizzes)
        .values({
          ownerId: user.id,
          title: input.title,
          description: input.description,
          category: input.category,
          difficulty: input.difficulty,
          timeLimitMinutes: input.timeLimitMinutes,
          totalQuestions: input.totalQuestions,
          totalMarks: input.totalMarks,
          isPublished: input.isPublished,
        })
        .returning();

      return { quiz };
    },
  }),

  /**
   * Update basic quiz settings.
   */
  updateQuiz: defineAction({
    input: z.object({
      id: z.number().int(),
      title: z.string().min(1, "Title is required").optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      difficulty: z.string().optional(),
      timeLimitMinutes: z.number().int().positive().optional(),
      totalQuestions: z.number().int().positive().optional(),
      totalMarks: z.number().int().positive().optional(),
      isPublished: z.boolean().optional(),
      isArchived: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const { id, ...rest } = input;

      const [existing] = await db
        .select()
        .from(Quizzes)
        .where(and(eq(Quizzes.id, id), eq(Quizzes.ownerId, user.id)))
        .limit(1);

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Quiz not found or you do not have access.",
        });
      }

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "undefined") {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return { quiz: existing };
      }

      const [quiz] = await db
        .update(Quizzes)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(Quizzes.id, id), eq(Quizzes.ownerId, user.id)))
        .returning();

      return { quiz };
    },
  }),

  /**
   * Soft delete (archive) a quiz.
   */
  archiveQuiz: defineAction({
    input: z.object({
      id: z.number().int(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [quiz] = await db
        .update(Quizzes)
        .set({
          isArchived: true,
          updatedAt: new Date(),
        })
        .where(and(eq(Quizzes.id, input.id), eq(Quizzes.ownerId, user.id)))
        .returning();

      if (!quiz) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Quiz not found or you do not have access.",
        });
      }

      return { quiz };
    },
  }),

  /**
   * List quizzes for the current user.
   */
  listMyQuizzes: defineAction({
    input: z
      .object({
        includeArchived: z.boolean().optional(),
      })
      .optional(),
    handler: async (input, context) => {
      const user = requireUser(context);
      const includeArchived = input?.includeArchived ?? false;

      let quizzes;

      if (includeArchived) {
        quizzes = await db
          .select()
          .from(Quizzes)
          .where(eq(Quizzes.ownerId, user.id));
      } else {
        quizzes = await db
          .select()
          .from(Quizzes)
          .where(and(eq(Quizzes.ownerId, user.id), eq(Quizzes.isArchived, false)));
      }

      return { quizzes };
    },
  }),

  /**
   * Get a single quiz with its questions.
   */
  getQuizWithQuestions: defineAction({
    input: z.object({
      id: z.number().int(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [quiz] = await db
        .select()
        .from(Quizzes)
        .where(and(eq(Quizzes.id, input.id), eq(Quizzes.ownerId, user.id)))
        .limit(1);

      if (!quiz) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Quiz not found or you do not have access.",
        });
      }

      const questions = await db
        .select()
        .from(QuizQuestions)
        .where(eq(QuizQuestions.quizId, input.id))
        .orderBy(QuizQuestions.orderIndex);

      return { quiz, questions };
    },
  }),

  /**
   * Upsert a question (create or update).
   */
  saveQuestion: defineAction({
    input: z.object({
      id: z.number().int().optional(),
      quizId: z.number().int(),
      orderIndex: z.number().int().min(1),
      questionType: z
        .enum(["single_choice", "multiple_choice", "true_false", "short_text"])
        .optional(),
      questionText: z.string().min(1, "Question text is required"),
      explanation: z.string().optional(),
      options: z.array(z.string()).optional(),
      correctAnswers: z.any().optional(), // can be indexes or values
      marks: z.number().int().positive().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [quiz] = await db
        .select()
        .from(Quizzes)
        .where(and(eq(Quizzes.id, input.quizId), eq(Quizzes.ownerId, user.id)))
        .limit(1);

      if (!quiz) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Quiz not found or you do not have access.",
        });
      }

      const baseValues = {
        quizId: input.quizId,
        orderIndex: input.orderIndex,
        questionType: input.questionType,
        questionText: input.questionText,
        explanation: input.explanation,
        optionsJson: input.options,
        correctAnswersJson: input.correctAnswers,
        marks: input.marks,
      };

      if (input.id) {
        const [updated] = await db
          .update(QuizQuestions)
          .set({
            ...baseValues,
            updatedAt: new Date(),
          })
          .where(eq(QuizQuestions.id, input.id))
          .returning();

        if (!updated) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Question not found.",
          });
        }

        return { question: updated };
      }

      const [created] = await db.insert(QuizQuestions).values(baseValues).returning();
      return { question: created };
    },
  }),

  /**
   * Delete a question from a quiz.
   */
  deleteQuestion: defineAction({
    input: z.object({
      id: z.number().int(),
      quizId: z.number().int(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [quiz] = await db
        .select()
        .from(Quizzes)
        .where(and(eq(Quizzes.id, input.quizId), eq(Quizzes.ownerId, user.id)))
        .limit(1);

      if (!quiz) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Quiz not found or you do not have access.",
        });
      }

      const [deleted] = await db
        .delete(QuizQuestions)
        .where(and(eq(QuizQuestions.id, input.id), eq(QuizQuestions.quizId, input.quizId)))
        .returning();

      if (!deleted) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Question not found.",
        });
      }

      return { question: deleted };
    },
  }),

  /**
   * Start an attempt for the current user.
   */
  startAttempt: defineAction({
    input: z.object({
      quizId: z.number().int(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [quiz] = await db
        .select()
        .from(Quizzes)
        .where(eq(Quizzes.id, input.quizId))
        .limit(1);

      if (!quiz || quiz.isArchived || !quiz.isPublished) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Quiz is not available.",
        });
      }

      const [attempt] = await db
        .insert(QuizAttempts)
        .values({
          quizId: input.quizId,
          userId: user.id,
          status: "in-progress",
        })
        .returning();

      return { attempt };
    },
  }),

  /**
   * Save a response for a question inside an attempt.
   */
  saveResponse: defineAction({
    input: z.object({
      attemptId: z.number().int(),
      quizId: z.number().int(),
      questionId: z.number().int(),
      answer: z.any().optional(),
      isCorrect: z.boolean().optional(),
      marksAwarded: z.number().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [attempt] = await db
        .select()
        .from(QuizAttempts)
        .where(
          and(
            eq(QuizAttempts.id, input.attemptId),
            eq(QuizAttempts.quizId, input.quizId),
            eq(QuizAttempts.userId, user.id)
          )
        )
        .limit(1);

      if (!attempt) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Attempt not found.",
        });
      }

      const [existing] = await db
        .select()
        .from(QuizResponses)
        .where(
          and(
            eq(QuizResponses.attemptId, input.attemptId),
            eq(QuizResponses.questionId, input.questionId)
          )
        )
        .limit(1);

      const baseValues = {
        attemptId: input.attemptId,
        quizId: input.quizId,
        questionId: input.questionId,
        answerJson: input.answer,
        isCorrect: input.isCorrect ?? false,
        marksAwarded: input.marksAwarded ?? 0,
      };

      if (existing) {
        const [updated] = await db
          .update(QuizResponses)
          .set({
            ...baseValues,
            updatedAt: new Date(),
          })
          .where(eq(QuizResponses.id, existing.id))
          .returning();

        return { response: updated };
      }

      const [created] = await db.insert(QuizResponses).values(baseValues).returning();
      return { response: created };
    },
  }),

  /**
   * Complete an attempt and record summary stats.
   */
  completeAttempt: defineAction({
    input: z.object({
      attemptId: z.number().int(),
      totalQuestions: z.number().int().optional(),
      totalMarks: z.number().optional(),
      obtainedMarks: z.number().optional(),
      correctCount: z.number().int().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [attempt] = await db
        .select()
        .from(QuizAttempts)
        .where(and(eq(QuizAttempts.id, input.attemptId), eq(QuizAttempts.userId, user.id)))
        .limit(1);

      if (!attempt) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Attempt not found.",
        });
      }

      const [updated] = await db
        .update(QuizAttempts)
        .set({
          completedAt: new Date(),
          status: "completed",
          totalQuestions: input.totalQuestions ?? attempt.totalQuestions,
          totalMarks: input.totalMarks ?? attempt.totalMarks,
          obtainedMarks: input.obtainedMarks ?? attempt.obtainedMarks,
          correctCount: input.correctCount ?? attempt.correctCount,
          updatedAt: new Date(),
        })
        .where(eq(QuizAttempts.id, input.attemptId))
        .returning();

      return { attempt: updated };
    },
  }),
};
