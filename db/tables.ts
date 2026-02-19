// db/tables.ts
import { column, defineTable, NOW } from "astro:db";

export const Platform = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    name: column.text(),
    description: column.text(),
    isActive: column.boolean({ default: true }),
    icon: column.text(),
    type: column.text({ optional: true }),
    qCount: column.number({ default: 0 }),
  },
});

export const Subject = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    platformId: column.number({ references: () => Platform.columns.id }),
    name: column.text(),
    isActive: column.boolean({ default: true }),
    qCount: column.number({ default: 0 }),
  },
});

export const Topic = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    platformId: column.number({ references: () => Platform.columns.id }),
    subjectId: column.number({ references: () => Subject.columns.id }),
    name: column.text(),
    isActive: column.boolean({ default: true }),
    qCount: column.number({ default: 0 }),
  },
});

export const Roadmap = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    platformId: column.number({ references: () => Platform.columns.id }),
    subjectId: column.number({ references: () => Subject.columns.id }),
    topicId: column.number({ references: () => Topic.columns.id }),
    name: column.text(),
    isActive: column.boolean({ default: true }),
    qCount: column.number({ default: 0 }),
  },
});

export const Question = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    platformId: column.number({ references: () => Platform.columns.id }),
    subjectId: column.number({ references: () => Subject.columns.id }),
    topicId: column.number({ references: () => Topic.columns.id }),
    roadmapId: column.number({ references: () => Roadmap.columns.id }),
    q: column.text(),
    o: column.json(),
    a: column.text(),
    e: column.text(),
    l: column.text({ enum: ["E", "M", "D"] }),
    isActive: column.boolean({ default: true }),
    verificationStatus: column.text({ default: "unverified" }),
    verificationCheckedAt: column.date({ optional: true }),
    verificationPayloadJson: column.text({ optional: true }),
    verificationReason: column.text({ optional: true }),
    verificationSuggestedChoiceIndex: column.number({ optional: true }),
    verificationSuggestedChoiceText: column.text({ optional: true }),
    verificationModel: column.text({ optional: true }),
    verificationAttempts: column.number({ default: 0 }),
  },
});

export const QuestionVerification = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    questionId: column.number({ references: () => Question.columns.id }),
    status: column.text(),
    payloadJson: column.text(),
    model: column.text({ optional: true }),
    userId: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
  },
});

export const Result = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    userId: column.text(),
    platformId: column.number({ references: () => Platform.columns.id }),
    subjectId: column.number({ references: () => Subject.columns.id }),
    topicId: column.number({ references: () => Topic.columns.id }),
    roadmapId: column.number({ references: () => Roadmap.columns.id }),
    level: column.text({ enum: ["E", "M", "D"] }),
    responses: column.json(),
    mark: column.number({ default: 0 }),
    createdAt: column.date({ default: NOW }),
  },
});

export const Faq = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    audience: column.text({ default: "user" }),
    category: column.text({ optional: true }),
    question: column.text(),
    answer_md: column.text(),
    sort_order: column.number({ default: 0 }),
    is_published: column.boolean({ default: false }),
    created_at: column.date({ default: NOW }),
    updated_at: column.date({ default: NOW }),
  },
  indexes: [
    {
      name: "faq_audience_published_idx",
      on: ["audience", "is_published"],
    },
    {
      name: "faq_sort_order_idx",
      on: "sort_order",
    },
  ],
});

export const quizTables = {
  Platform,
  Subject,
  Topic,
  Roadmap,
  Question,
  QuestionVerification,
  Result,
  Faq,
} as const;
