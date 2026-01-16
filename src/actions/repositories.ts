import { db, eq, Platform, Question, Roadmap, Result, Subject, Topic } from "astro:db";
import { BaseRepository } from "./baseRepository";

type PlatformRow = typeof Platform.$inferSelect;
type SubjectRow = typeof Subject.$inferSelect;
type TopicRow = typeof Topic.$inferSelect;
type RoadmapRow = typeof Roadmap.$inferSelect;
type QuestionRow = typeof Question.$inferSelect;

export const platformRepository = new BaseRepository<typeof Platform, PlatformRow>(Platform);

export type SubjectSelect = {
  subject: SubjectRow;
  platformName: string | null;
};

class SubjectQueryRepository extends BaseRepository<typeof Subject, SubjectSelect> {
  protected createSelectQuery() {
    return db
      .select({ subject: Subject, platformName: Platform.name })
      .from(Subject)
      .leftJoin(Platform, eq(Subject.platformId, Platform.id));
  }
}

export const subjectRepository = new BaseRepository(Subject);
export const subjectQueryRepository = new SubjectQueryRepository(Subject);

export type TopicSelect = {
  topic: TopicRow;
  subjectName: string | null;
  platformName: string | null;
};

class TopicQueryRepository extends BaseRepository<typeof Topic, TopicSelect> {
  protected createSelectQuery() {
    return db
      .select({
        topic: Topic,
        subjectName: Subject.name,
        platformName: Platform.name,
      })
      .from(Topic)
      .leftJoin(Subject, eq(Topic.subjectId, Subject.id))
      .leftJoin(Platform, eq(Topic.platformId, Platform.id));
  }
}

export const topicRepository = new BaseRepository(Topic);
export const topicQueryRepository = new TopicQueryRepository(Topic);

export type RoadmapSelect = {
  roadmap: RoadmapRow;
  platformName: string | null;
  subjectName: string | null;
  topicName: string | null;
};

class RoadmapQueryRepository extends BaseRepository<typeof Roadmap, RoadmapSelect> {
  protected createSelectQuery() {
    return db
      .select({
        roadmap: Roadmap,
        platformName: Platform.name,
        subjectName: Subject.name,
        topicName: Topic.name,
      })
      .from(Roadmap)
      .leftJoin(Platform, eq(Roadmap.platformId, Platform.id))
      .leftJoin(Subject, eq(Roadmap.subjectId, Subject.id))
      .leftJoin(Topic, eq(Roadmap.topicId, Topic.id));
  }
}

export const roadmapRepository = new BaseRepository(Roadmap);
export const roadmapQueryRepository = new RoadmapQueryRepository(Roadmap);

export type QuestionSelect = {
  question: QuestionRow;
  platformName: string | null;
  subjectName: string | null;
  topicName: string | null;
  roadmapName: string | null;
};

class QuestionQueryRepository extends BaseRepository<typeof Question, QuestionSelect> {
  protected createSelectQuery() {
    return db
      .select({
        question: Question,
        platformName: Platform.name,
        subjectName: Subject.name,
        topicName: Topic.name,
        roadmapName: Roadmap.name,
      })
      .from(Question)
      .leftJoin(Platform, eq(Question.platformId, Platform.id))
      .leftJoin(Subject, eq(Question.subjectId, Subject.id))
      .leftJoin(Topic, eq(Question.topicId, Topic.id))
      .leftJoin(Roadmap, eq(Question.roadmapId, Roadmap.id));
  }
}

export const questionRepository = new BaseRepository(Question);
export const questionQueryRepository = new QuestionQueryRepository(Question);

export const resultRepository = new BaseRepository(Result);
