import type Alpine from "alpinejs";
import { AvBaseStore, safeErrorMessage } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";

type PlatformItem = {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  qCount: number;
  isActive: boolean;
};

type SubjectItem = {
  id: number;
  platformId: number;
  name: string;
  qCount: number;
  isActive: boolean;
};

type TopicItem = {
  id: number;
  platformId: number;
  subjectId: number;
  name: string;
  qCount: number;
  isActive: boolean;
};

type RoadmapItem = {
  id: number;
  platformId: number;
  subjectId: number;
  topicId: number;
  name: string;
  qCount: number;
  isActive: boolean;
};

type QuestionItem = {
  id: number;
  questionText: string;
  options: string[];
  answerKey: string;
  explanation?: string | null;
  level: "E" | "M" | "D";
  correctIndex: number;
};

type LevelItem = {
  id: "E" | "M" | "D";
  name: string;
  description: string;
};

const defaultLevels: LevelItem[] = [
  { id: "E", name: "Easy", description: "Warm-up questions to build confidence." },
  { id: "M", name: "Medium", description: "Core knowledge checks for steady progress." },
  { id: "D", name: "Hard", description: "Challenge mode for deeper recall." },
];

const defaultSelection = () => ({
  platformId: null as number | null,
  subjectId: null as number | null,
  topicId: null as number | null,
  roadmapId: null as number | null,
  levelId: null as LevelItem["id"] | null,
  answers: [] as number[],
});

const defaultState = () => ({
  step: 1,
  search: "",
  steps: [
    { id: 1, label: "Platform" },
    { id: 2, label: "Subject" },
    { id: 3, label: "Topic" },
    { id: 4, label: "Roadmap" },
    { id: 5, label: "Level" },
    { id: 6, label: "Quiz" },
  ],
  list: {
    platforms: [] as PlatformItem[],
    subjects: [] as SubjectItem[],
    topics: [] as TopicItem[],
    roadmaps: [] as RoadmapItem[],
    questions: [] as QuestionItem[],
    levels: defaultLevels,
  },
  selection: defaultSelection(),
  currentQuestion: 0,
  isCompleted: false,
  mark: 0,
  showAnswers: false,
  loading: false,
  isPaid: false,
  paywallMessage: null as string | null,
  error: null as string | null,
  roadmapPage: 1,
  roadmapTotal: 0,
  roadmapPageSize: 48,
});

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const resolveCorrectIndex = (options: string[], answerKey: string) => {
  if (!Array.isArray(options) || options.length === 0) return -1;
  const key = (answerKey || "").trim();
  if (!key) return -1;

  const numericKey = Number.parseInt(key, 10);
  if (!Number.isNaN(numericKey)) {
    if (numericKey >= 0 && numericKey < options.length) return numericKey;
    const zeroBased = numericKey - 1;
    if (zeroBased >= 0 && zeroBased < options.length) return zeroBased;
  }

  if (key.length === 1) {
    const alphaIndex = key.toLowerCase().charCodeAt(0) - 97;
    if (alphaIndex >= 0 && alphaIndex < options.length) return alphaIndex;
  }

  const lowerKey = key.toLowerCase();
  const matchIndex = options.findIndex((option) => option.trim().toLowerCase() === lowerKey);
  return matchIndex >= 0 ? matchIndex : -1;
};

export class QuizStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  private _roadmapQueryTimer: number | null = null;
  private _roadmapReqId = 0;
  step = 1;
  search = "";
  steps = defaultState().steps;
  list = defaultState().list;
  selection = defaultSelection();
  currentQuestion = 0;
  isCompleted = false;
  mark = 0;
  showAnswers = false;
  loading = false;
  isPaid = false;
  paywallMessage: string | null = null;
  error: string | null = null;
  roadmapPage = 1;
  roadmapTotal = 0;
  roadmapPageSize = 48;

  init(initial?: Partial<ReturnType<typeof defaultState>>) {
    if (!initial) return;
    const base = defaultState();
    Object.assign(this, base, initial);

    this.list = {
      ...base.list,
      ...(initial.list ?? {}),
      levels: (initial.list?.levels ?? base.list.levels) as LevelItem[],
    };
    this.selection = {
      ...base.selection,
      ...(initial.selection ?? {}),
      answers: (initial.selection?.answers ?? base.selection.answers) as number[],
    };

    this.step = Math.max(1, Number(initial.step ?? this.step));
    this.roadmapPage = Math.max(1, Number(initial.roadmapPage ?? this.roadmapPage));
    this.roadmapTotal = Math.max(0, Number(initial.roadmapTotal ?? this.roadmapTotal));
    this.roadmapPageSize = Math.max(1, Number(initial.roadmapPageSize ?? this.roadmapPageSize));
  }

  private unwrapResult<T = any>(result: any): T {
    if (result?.error) {
      const message = result.error?.message || result.error;
      throw new Error(message || "Request failed.");
    }
    return (result?.data ?? result) as T;
  }

  private async callFetchRoadmaps(payload: any) {
    const a: any = actions as any;
    if (a?.fetchRoadmaps) return await a.fetchRoadmaps(payload);
    if (a?.quiz?.fetchRoadmaps) return await a.quiz.fetchRoadmaps(payload);
    throw new Error("fetchRoadmaps action not found.");
  }

  private async callFetchRandomQuestions(payload: any) {
    const a: any = actions as any;
    if (a?.fetchRandomQuestions) return await a.fetchRandomQuestions(payload);
    if (a?.quiz?.fetchRandomQuestions) return await a.quiz.fetchRandomQuestions(payload);
    throw new Error("fetchRandomQuestions action not found.");
  }

  private async callSaveResult(payload: any) {
    const a: any = actions as any;
    if (a?.saveResult) return await a.saveResult(payload);
    if (a?.quiz?.saveResult) return await a.quiz.saveResult(payload);
    throw new Error("saveResult action not found.");
  }

  get totalQuestions() {
    return Array.isArray(this.list.questions) ? this.list.questions.length : 0;
  }

  get answeredCount() {
    return this.selection.answers.filter((value) => value >= 0).length;
  }

  get canSubmit() {
    return this.totalQuestions > 0 && this.answeredCount === this.totalQuestions;
  }

  get currentQuestionItem() {
    return this.list.questions[this.currentQuestion] ?? null;
  }

  get stepTitle() {
    const titles = [
      "Choose a platform",
      "Choose a subject",
      "Choose a topic",
      "Choose a roadmap",
      "Pick a level",
      "Take the quiz",
    ];
    return titles[this.step - 1] ?? "Quiz";
  }

  get maxStep() {
    let max = 1;
    if (this.selection.platformId) max = 2;
    if (this.selection.subjectId) max = 3;
    if (this.selection.topicId) max = 4;
    if (this.selection.roadmapId) max = 5;
    if (this.selection.levelId) max = 6;
    return max;
  }

  get selectedPlatform() {
    return this.list.platforms.find((item) => item.id === this.selection.platformId) ?? null;
  }

  get selectedSubject() {
    return this.list.subjects.find((item) => item.id === this.selection.subjectId) ?? null;
  }

  get selectedTopic() {
    return this.list.topics.find((item) => item.id === this.selection.topicId) ?? null;
  }

  get selectedRoadmap() {
    return this.list.roadmaps.find((item) => item.id === this.selection.roadmapId) ?? null;
  }

  get platformLabel() {
    return this.selectedPlatform?.name ?? "--";
  }

  get subjectLabel() {
    return this.selectedSubject?.name ?? "--";
  }

  get topicLabel() {
    return this.selectedTopic?.name ?? "--";
  }

  get roadmapLabel() {
    return this.selectedRoadmap?.name ?? "--";
  }

  get levelLabel() {
    return this.list.levels.find((level) => level.id === this.selection.levelId)?.name ?? "--";
  }

  get isPro() {
    return this.isPaid === true;
  }

  isLevelLocked(level: LevelItem) {
    return level.id === "D" && !this.isPro;
  }

  get filteredPlatforms() {
    const term = normalizeSearch(this.search);
    return this.list.platforms
      .filter((item) => item.isActive)
      .filter((item) => !term || item.name.toLowerCase().includes(term));
  }

  get filteredSubjects() {
    const term = normalizeSearch(this.search);
    return this.list.subjects
      .filter((item) => item.isActive)
      .filter((item) => !this.selection.platformId || item.platformId === this.selection.platformId)
      .filter((item) => !term || item.name.toLowerCase().includes(term));
  }

  get filteredTopics() {
    const term = normalizeSearch(this.search);
    return this.list.topics
      .filter((item) => item.isActive)
      .filter((item) => !this.selection.platformId || item.platformId === this.selection.platformId)
      .filter((item) => !this.selection.subjectId || item.subjectId === this.selection.subjectId)
      .filter((item) => !term || item.name.toLowerCase().includes(term));
  }

  get filteredRoadmaps() {
    const term = normalizeSearch(this.search);
    return this.list.roadmaps
      .filter((item) => item.isActive)
      .filter((item) => !term || item.name.toLowerCase().includes(term));
  }

  canNavigateTo(step: number) {
    return step <= this.maxStep;
  }

  goToStep(step: number) {
    if (!this.canNavigateTo(step)) return;
    this.step = step;
    if (step < 6) {
      this.showAnswers = false;
    }
  }

  setSearch(value: string) {
    this.search = value ?? "";
    if (this.step === 4) {
      if (this._roadmapQueryTimer) window.clearTimeout(this._roadmapQueryTimer);
      this._roadmapQueryTimer = window.setTimeout(() => {
        this.loadRoadmaps(true);
        this._roadmapQueryTimer = null;
      }, 250);
    }
  }

  choosePlatform(id: number) {
    this.selection.platformId = id;
    this.selection.subjectId = null;
    this.selection.topicId = null;
    this.selection.roadmapId = null;
    this.selection.levelId = null;
    this.selection.answers = [];
    this.list.roadmaps = [];
    this.list.questions = [];
    this.step = 2;
    this.search = "";
    this.isCompleted = false;
    this.showAnswers = false;
  }

  chooseSubject(id: number) {
    this.selection.subjectId = id;
    this.selection.topicId = null;
    this.selection.roadmapId = null;
    this.selection.levelId = null;
    this.selection.answers = [];
    this.list.roadmaps = [];
    this.list.questions = [];
    this.step = 3;
    this.search = "";
    this.isCompleted = false;
    this.showAnswers = false;
  }

  chooseTopic(id: number) {
    this.selection.topicId = id;
    this.selection.roadmapId = null;
    this.selection.levelId = null;
    this.selection.answers = [];
    this.list.roadmaps = [];
    this.list.questions = [];
    this.step = 4;
    this.search = "";
    this.isCompleted = false;
    this.showAnswers = false;
    this.loadRoadmaps(true);
  }

  chooseRoadmap(id: number) {
    this.selection.roadmapId = id;
    this.selection.levelId = null;
    this.selection.answers = [];
    this.list.questions = [];
    this.step = 5;
    this.search = "";
    this.isCompleted = false;
    this.showAnswers = false;
  }

  chooseLevel(id: LevelItem["id"]) {
    if (id === "D" && !this.isPro) {
      this.paywallMessage = "Difficult level is available in Pro.";
      return;
    }
    this.paywallMessage = null;
    this.selection.levelId = id;
    this.selection.answers = [];
    this.list.questions = [];
    this.currentQuestion = 0;
    this.isCompleted = false;
    this.showAnswers = false;
    this.loadQuestions();
  }

  async loadRoadmaps(reset = false) {
    if (!this.selection.platformId || !this.selection.subjectId || !this.selection.topicId) {
      return;
    }
    const requestId = ++this._roadmapReqId;

    if (reset) {
      this.roadmapPage = 1;
      this.roadmapTotal = 0;
      this.list.roadmaps = [];
    }

    this.loading = true;
    this.error = null;

    try {
      const res = await this.callFetchRoadmaps({
        page: this.roadmapPage,
        pageSize: this.roadmapPageSize,
        filters: {
          platformId: this.selection.platformId,
          subjectId: this.selection.subjectId,
          topicId: this.selection.topicId,
          name: this.search ? this.search : undefined,
          status: "active",
        },
        sort: { column: "id", direction: "asc" },
      });

      const data = this.unwrapResult(res);
      const items = (data?.items ?? []) as RoadmapItem[];
      if (requestId !== this._roadmapReqId) return;
      const existing = reset ? [] : this.list.roadmaps;
      const merged = [...existing, ...items].reduce((acc: RoadmapItem[], item) => {
        if (!acc.some((entry) => entry.id === item.id)) acc.push(item);
        return acc;
      }, []);

      this.list.roadmaps = merged;
      this.roadmapTotal = Number(data?.total ?? merged.length ?? 0);
      this.roadmapPage = Math.max(1, Number(data?.page ?? this.roadmapPage));
    } catch (err) {
      this.error = safeErrorMessage(err, "Failed to load roadmaps.");
    } finally {
      this.loading = false;
    }
  }

  get roadmapHasMore() {
    return this.list.roadmaps.length < this.roadmapTotal;
  }

  loadMoreRoadmaps() {
    if (!this.roadmapHasMore) return;
    this.roadmapPage += 1;
    this.loadRoadmaps();
  }

  async loadQuestions() {
    if (
      !this.selection.platformId ||
      !this.selection.subjectId ||
      !this.selection.topicId ||
      !this.selection.roadmapId ||
      !this.selection.levelId
    ) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.paywallMessage = null;
    this.list.questions = [];
    this.selection.answers = [];
    this.currentQuestion = 0;

    try {
      const res = await this.callFetchRandomQuestions({
        filters: {
          platformId: this.selection.platformId,
          subjectId: this.selection.subjectId,
          topicId: this.selection.topicId,
          roadmapId: this.selection.roadmapId,
          level: this.selection.levelId,
          status: "active",
        },
      });

      if (res?.error?.code === "PAYMENT_REQUIRED") {
        this.paywallMessage = res.error.message || "Difficult level is available in Pro.";
        return;
      }

      const data = this.unwrapResult(res);
      const items = (data?.items ?? []) as Array<
        Omit<QuestionItem, "correctIndex"> & { answerKey: string }
      >;
      const questions = items.map((item) => ({
        ...item,
        correctIndex: resolveCorrectIndex(item.options ?? [], item.answerKey ?? ""),
      })) as QuestionItem[];

      this.list.questions = questions;
      this.selection.answers = questions.map(() => -1);
      this.step = 6;
    } catch (err) {
      this.error = safeErrorMessage(err, "Failed to load questions.");
    } finally {
      this.loading = false;
    }
  }

  previousQuestion() {
    if (this.currentQuestion <= 0) return;
    this.currentQuestion -= 1;
  }

  nextQuestion() {
    if (this.currentQuestion >= this.totalQuestions - 1) return;
    this.currentQuestion += 1;
  }

  async finishQuiz() {
    if (!this.canSubmit) return;
    const score = this.list.questions.reduce((total, question, index) => {
      return total + (this.selection.answers[index] === question.correctIndex ? 1 : 0);
    }, 0);

    this.mark = score;
    this.isCompleted = true;
    this.error = null;

    const { platformId, subjectId, topicId, roadmapId, levelId } = this.selection;
    if (!platformId || !subjectId || !topicId || !roadmapId || !levelId) {
      return;
    }

    const responses = this.list.questions.map((question, index) => ({
      id: question.id,
      a: question.correctIndex,
      s: typeof this.selection.answers[index] === "number" ? this.selection.answers[index] : -1,
    }));

    try {
      const res = await this.callSaveResult({
        platformId,
        subjectId,
        topicId,
        roadmapId,
        level: levelId,
        mark: score,
        responses,
      });
      this.unwrapResult(res);
    } catch (err) {
      this.error = safeErrorMessage(err, "Failed to save result.");
    }
  }

  reset() {
    const levels = this.list.levels;
    const platforms = this.list.platforms;
    const subjects = this.list.subjects;
    const topics = this.list.topics;

    Object.assign(this, defaultState());
    this.list.levels = levels;
    this.list.platforms = platforms;
    this.list.subjects = subjects;
    this.list.topics = topics;
  }
}

export const registerQuizStore = (AlpineInstance: typeof Alpine) => {
  AlpineInstance.store("quiz", new QuizStore());
};
