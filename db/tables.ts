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

export const quizTables = {
  Platform,
  Subject,
  Topic,
  Roadmap,
  Question,
  Result,
} as const;
