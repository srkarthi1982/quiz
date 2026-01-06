import type Alpine from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";

export type AdminQuestionItem = {
  id: number;
  platformId: number;
  subjectId: number;
  topicId: number;
  roadmapId: number | null;
  questionText: string;
  options: string[];
  answerKey: string;
  explanation: string;
  level: "E" | "M" | "D";
  isActive: boolean;
  platformName?: string | null;
  subjectName?: string | null;
  topicName?: string | null;
  roadmapName?: string | null;
};

export type AdminQuestionPlatform = {
  id: number;
  name: string;
};

export type AdminQuestionSubject = {
  id: number;
  name: string;
  platformId: number;
};

export type AdminQuestionTopic = {
  id: number;
  name: string;
  platformId: number;
  subjectId: number;
};

export type AdminQuestionRoadmap = {
  id: number;
  name: string | null;
  platformId: number;
  subjectId: number;
  topicId: number;
};

export type AdminQuestionsSort =
  | "id"
  | "questionText"
  | "platformName"
  | "subjectName"
  | "topicName"
  | "roadmapName"
  | "platformId"
  | "subjectId"
  | "topicId"
  | "roadmapId"
  | "level"
  | "status";
export type AdminQuestionsDir = "asc" | "desc";

const PAGE_SIZE = 10;
const ROADMAP_PAGE_SIZE = 48;

const defaultForm = () => ({
  platformId: "",
  subjectId: "",
  topicId: "",
  roadmapId: "",
  questionText: "",
  optionsText: "",
  answerKey: "",
  explanation: "",
  level: "E",
  isActive: true,
});

const defaultState = () => ({
  items: [] as AdminQuestionItem[],
  platforms: [] as AdminQuestionPlatform[],
  subjects: [] as AdminQuestionSubject[],
  topics: [] as AdminQuestionTopic[],
  roadmaps: [] as AdminQuestionRoadmap[],
  formRoadmaps: [] as AdminQuestionRoadmap[],
  formRoadmapOverride: null as AdminQuestionRoadmap | null,
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  q: "",
  platformId: "",
  subjectId: "",
  topicId: "",
  roadmapId: "",
  level: "",
  status: "all",
  sort: "id" as AdminQuestionsSort,
  dir: "desc" as AdminQuestionsDir,
  drawerOpen: false,
  drawerMode: "create" as "create" | "edit",
  editingId: null as number | null,
  pendingDeleteId: null as number | null,
  pendingDeleteName: null as string | null,
  form: defaultForm(),
  loading: false,
  error: null as string | null,
  success: null as string | null,
});

export class AdminQuestionsStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  items: AdminQuestionItem[] = [];
  platforms: AdminQuestionPlatform[] = [];
  subjects: AdminQuestionSubject[] = [];
  topics: AdminQuestionTopic[] = [];
  roadmaps: AdminQuestionRoadmap[] = [];
  formRoadmaps: AdminQuestionRoadmap[] = [];
  formRoadmapOverride: AdminQuestionRoadmap | null = null;
  total = 0;
  page = 1;
  pageSize = PAGE_SIZE;
  q = "";
  platformId = "";
  subjectId = "";
  topicId = "";
  roadmapId = "";
  level = "";
  status = "all";
  sort: AdminQuestionsSort = "id";
  dir: AdminQuestionsDir = "desc";
  drawerOpen = false;
  drawerMode: "create" | "edit" = "create";
  editingId: number | null = null;
  pendingDeleteId: number | null = null;
  pendingDeleteName: string | null = null;
  form = defaultForm();
  loading = false;
  error: string | null = null;
  success: string | null = null;

  private _queryTimer: number | null = null;

  get totalPages() {
    return Math.max(1, Math.ceil((this.total || 0) / this.pageSize));
  }

  init(initial?: Partial<ReturnType<typeof defaultState>>) {
    if (!initial) return;
    Object.assign(this, defaultState(), initial);

    this.page = Math.max(1, Number(initial.page ?? this.page ?? 1));
    this.pageSize = Math.max(1, Number(initial.pageSize ?? this.pageSize ?? PAGE_SIZE));
    this.total = Math.max(0, Number(initial.total ?? this.total ?? 0));
    this.q = initial.q ?? "";
    this.platformId = initial.platformId ?? "";
    this.subjectId = initial.subjectId ?? "";
    this.topicId = initial.topicId ?? "";
    this.roadmapId = initial.roadmapId ?? "";
    this.level = initial.level ?? "";
    this.status = initial.status ?? "all";
    this.sort = (initial.sort ?? "id") as AdminQuestionsSort;
    this.dir = (initial.dir ?? "desc") as AdminQuestionsDir;
    this.items = (initial.items ?? []) as AdminQuestionItem[];
    this.platforms = (initial.platforms ?? []) as AdminQuestionPlatform[];
    this.subjects = (initial.subjects ?? []) as AdminQuestionSubject[];
    this.topics = (initial.topics ?? []) as AdminQuestionTopic[];
    this.roadmaps = (initial.roadmaps ?? []) as AdminQuestionRoadmap[];
    this.formRoadmaps = (initial.formRoadmaps ?? []) as AdminQuestionRoadmap[];
    this.form = {
      ...defaultForm(),
      ...(initial.form ?? {}),
    };
  }

  private async _callList(payload: any) {
    const a: any = actions as any;
    if (a?.fetchQuestions) return await a.fetchQuestions(payload);
    if (a?.quiz?.fetchQuestions) return await a.quiz.fetchQuestions(payload);
    throw new Error("fetchQuestions action not found.");
  }

  private async _callCreate(payload: any) {
    const a: any = actions as any;
    if (a?.createQuestion) return await a.createQuestion(payload);
    if (a?.quiz?.createQuestion) return await a.quiz.createQuestion(payload);
    throw new Error("createQuestion action not found.");
  }

  private async _callUpdate(payload: any) {
    const a: any = actions as any;
    if (a?.updateQuestion) return await a.updateQuestion(payload);
    if (a?.quiz?.updateQuestion) return await a.quiz.updateQuestion(payload);
    throw new Error("updateQuestion action not found.");
  }

  private async _callDelete(payload: any) {
    const a: any = actions as any;
    if (a?.deleteQuestion) return await a.deleteQuestion(payload);
    if (a?.quiz?.deleteQuestion) return await a.quiz.deleteQuestion(payload);
    throw new Error("deleteQuestion action not found.");
  }

  private async _callFetchRoadmaps(payload: any) {
    const a: any = actions as any;
    if (a?.fetchRoadmaps) return await a.fetchRoadmaps(payload);
    if (a?.quiz?.fetchRoadmaps) return await a.quiz.fetchRoadmaps(payload);
    throw new Error("fetchRoadmaps action not found.");
  }

  private unwrapResult<T = any>(result: any): T {
    if (result?.error) {
      const message = result.error?.message || result.error;
      throw new Error(message || "Request failed.");
    }
    return (result?.data ?? result) as T;
  }

  private buildFilters() {
    const filters: Record<string, any> = {};

    if (this.q) filters.questionText = this.q;
    if (this.platformId) filters.platformId = Number(this.platformId);
    if (this.subjectId) filters.subjectId = Number(this.subjectId);
    if (this.topicId) filters.topicId = Number(this.topicId);
    if (this.roadmapId) filters.roadmapId = Number(this.roadmapId);
    if (this.level) filters.level = this.level;
    if (this.status === "active" || this.status === "inactive") {
      filters.status = this.status;
    }

    return Object.keys(filters).length ? filters : undefined;
  }

  private buildRoadmapFilters(source: {
    platformId?: string;
    subjectId?: string;
    topicId?: string;
  }) {
    const filters: Record<string, number> = {};
    if (source.platformId) filters.platformId = Number(source.platformId);
    if (source.subjectId) filters.subjectId = Number(source.subjectId);
    if (source.topicId) filters.topicId = Number(source.topicId);
    return Object.keys(filters).length ? filters : undefined;
  }

  private async loadRoadmapsForFilters() {
    try {
      const res = await this._callFetchRoadmaps({
        page: 1,
        pageSize: ROADMAP_PAGE_SIZE,
        filters: this.buildRoadmapFilters({
          platformId: this.platformId,
          subjectId: this.subjectId,
          topicId: this.topicId,
        }),
        sort: { column: "name", direction: "asc" },
      });
      const data = this.unwrapResult(res);
      const items = (data?.items ?? []) as any[];
      this.roadmaps = items.map((roadmap) => ({
        id: roadmap.id,
        name: roadmap.name ?? null,
        platformId: roadmap.platformId,
        subjectId: roadmap.subjectId,
        topicId: roadmap.topicId,
      }));
    } catch (err: any) {
      this.error = err?.message || "Failed to load roadmaps.";
      this.roadmaps = [];
    }
  }

  private async loadRoadmapsForForm() {
    try {
      const res = await this._callFetchRoadmaps({
        page: 1,
        pageSize: ROADMAP_PAGE_SIZE,
        filters: this.buildRoadmapFilters({
          platformId: this.form?.platformId,
          subjectId: this.form?.subjectId,
          topicId: this.form?.topicId,
        }),
        sort: { column: "name", direction: "asc" },
      });
      const data = this.unwrapResult(res);
      const items = (data?.items ?? []) as any[];
      let next = items.map((roadmap) => ({
        id: roadmap.id,
        name: roadmap.name ?? null,
        platformId: roadmap.platformId,
        subjectId: roadmap.subjectId,
        topicId: roadmap.topicId,
      }));

      if (this.formRoadmapOverride && !next.some((r) => r.id === this.formRoadmapOverride?.id)) {
        next = [this.formRoadmapOverride, ...next];
      }
      this.formRoadmaps = next;
    } catch (err: any) {
      this.error = err?.message || "Failed to load roadmaps.";
      this.formRoadmaps = this.formRoadmapOverride ? [this.formRoadmapOverride] : [];
    }
  }

  async load() {
    this.loading = true;
    this.error = null;

    try {
      const res = await this._callList({
        page: this.page,
        pageSize: this.pageSize,
        filters: this.buildFilters(),
        sort: { column: this.sort, direction: this.dir },
      });

      const data = this.unwrapResult(res);
      this.items = (data?.items ?? []) as AdminQuestionItem[];
      this.total = Number(data?.total ?? this.items.length ?? 0);
      this.page = Math.max(1, Number(data?.page ?? this.page));
      this.pageSize = Math.max(1, Number(data?.pageSize ?? this.pageSize));
    } catch (err: any) {
      this.error = err?.message || "Failed to load questions.";
    } finally {
      this.loading = false;
    }
  }

  fetchList() {
    return this.load();
  }

  setQuery(value: string) {
    this.q = value ?? "";
    this.page = 1;

    if (this._queryTimer) window.clearTimeout(this._queryTimer);
    this._queryTimer = window.setTimeout(() => {
      this.load();
      this._queryTimer = null;
    }, 250);
  }

  setPlatform(value: string) {
    this.platformId = value ?? "";
    if (this.subjectId) this.subjectId = "";
    if (this.topicId) this.topicId = "";
    if (this.roadmapId) this.roadmapId = "";
    this.page = 1;
    void this.loadRoadmapsForFilters();
    this.load();
  }

  setSubject(value: string) {
    this.subjectId = value ?? "";
    if (this.topicId) this.topicId = "";
    if (this.roadmapId) this.roadmapId = "";
    this.page = 1;
    void this.loadRoadmapsForFilters();
    this.load();
  }

  setTopic(value: string) {
    this.topicId = value ?? "";
    if (this.roadmapId) this.roadmapId = "";
    this.page = 1;
    void this.loadRoadmapsForFilters();
    this.load();
  }

  setRoadmap(value: string) {
    this.roadmapId = value ?? "";
    this.page = 1;
    this.load();
  }

  setLevel(value: string) {
    this.level = value ?? "";
    this.page = 1;
    this.load();
  }

  setStatus(value: string) {
    this.status = value ?? "all";
    this.page = 1;
    this.load();
  }

  setSort(value: string, dir?: string) {
    const nextDir = dir === "asc" ? "asc" : "desc";
    this.sort = (value || "id") as AdminQuestionsSort;
    this.dir = nextDir;
    this.page = 1;
    this.load();
  }

  resetFilters() {
    this.q = "";
    this.platformId = "";
    this.subjectId = "";
    this.topicId = "";
    this.roadmapId = "";
    this.level = "";
    this.status = "all";
    this.sort = "id";
    this.dir = "desc";
    this.page = 1;
    void this.loadRoadmapsForFilters();
    this.load();
  }

  goToPage(n: number) {
    const next = Math.min(Math.max(Number(n || 1), 1), this.totalPages);
    if (next === this.page) return;
    this.page = next;
    this.load();
  }

  setFormPlatform(value: string) {
    this.form.platformId = value ?? "";
    if (this.form.subjectId) this.form.subjectId = "";
    if (this.form.topicId) this.form.topicId = "";
    if (this.form.roadmapId) this.form.roadmapId = "";
    void this.loadRoadmapsForForm();
  }

  setFormSubject(value: string) {
    this.form.subjectId = value ?? "";
    if (this.form.topicId) this.form.topicId = "";
    if (this.form.roadmapId) this.form.roadmapId = "";
    void this.loadRoadmapsForForm();
  }

  setFormTopic(value: string) {
    this.form.topicId = value ?? "";
    if (this.form.roadmapId) this.form.roadmapId = "";
    void this.loadRoadmapsForForm();
  }

  openCreate() {
    this.drawerOpen = true;
    this.drawerMode = "create";
    this.editingId = null;
    this.form = defaultForm();
    this.formRoadmapOverride = null;
    void this.loadRoadmapsForForm();
    this.error = null;
    this.success = null;
  }

  openEdit(question: AdminQuestionItem) {
    this.drawerOpen = true;
    this.drawerMode = "edit";
    this.editingId = question?.id ?? null;
    this.form = {
      platformId: question?.platformId ? String(question.platformId) : "",
      subjectId: question?.subjectId ? String(question.subjectId) : "",
      topicId: question?.topicId ? String(question.topicId) : "",
      roadmapId: question?.roadmapId ? String(question.roadmapId) : "",
      questionText: question?.questionText ?? "",
      optionsText: Array.isArray(question?.options) ? question.options.join("\n") : "",
      answerKey: question?.answerKey ?? "",
      explanation: question?.explanation ?? "",
      level: question?.level ?? "E",
      isActive: question?.isActive ?? true,
    };
    this.formRoadmapOverride = question?.roadmapId
      ? {
          id: question.roadmapId,
          name: question.roadmapName ?? null,
          platformId: question.platformId,
          subjectId: question.subjectId,
          topicId: question.topicId,
        }
      : null;
    void this.loadRoadmapsForForm();
    this.error = null;
    this.success = null;
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.drawerMode = "create";
    this.editingId = null;
    this.form = defaultForm();
    this.formRoadmapOverride = null;
    this.error = null;
  }

  private validateForm() {
    const questionText = (this.form?.questionText || "").trim();
    const platformId = Number(this.form?.platformId || 0);
    const subjectId = Number(this.form?.subjectId || 0);
    const topicId = Number(this.form?.topicId || 0);
    const roadmapId = Number(this.form?.roadmapId || 0);
    const options = (this.form?.optionsText || "")
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const answerKey = (this.form?.answerKey || "").trim();
    const explanation = (this.form?.explanation || "").trim();
    const level = (this.form?.level || "E").toUpperCase();
    const isActive = !!this.form?.isActive;

    if (!Number.isFinite(platformId) || platformId <= 0) {
      return { error: "Platform is required." };
    }
    if (!Number.isFinite(subjectId) || subjectId <= 0) {
      return { error: "Subject is required." };
    }
    if (!Number.isFinite(topicId) || topicId <= 0) {
      return { error: "Topic is required." };
    }
    if (!Number.isFinite(roadmapId) || roadmapId <= 0) {
      return { error: "Roadmap is required." };
    }
    if (!questionText) return { error: "Question text is required." };
    if (!options.length) return { error: "Provide at least one option." };
    if (!answerKey) return { error: "Answer key is required." };
    if (!explanation) return { error: "Explanation is required." };
    if (level !== "E" && level !== "M" && level !== "D") {
      return { error: "Level must be E, M, or D." };
    }

    return {
      platformId,
      subjectId,
      topicId,
      roadmapId,
      questionText,
      options,
      answerKey,
      explanation,
      level,
      isActive,
    } as const;
  }

  async submit() {
    const validated = this.validateForm();
    if ((validated as any).error) {
      this.error = (validated as any).error;
      return;
    }

    const payload = validated as {
      platformId: number;
      subjectId: number;
      topicId: number;
      roadmapId: number;
      questionText: string;
      options: string[];
      answerKey: string;
      explanation: string;
      level: string;
      isActive: boolean;
    };

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      if (this.editingId) {
        this.unwrapResult(await this._callUpdate({ id: this.editingId, ...payload }));
        this.success = "Question updated.";
      } else {
        this.unwrapResult(await this._callCreate(payload));
        this.success = "Question created.";
      }

      this.closeDrawer();
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to save question.";
    } finally {
      this.loading = false;
    }
  }

  submitDrawer() {
    return this.submit();
  }

  async remove(id?: number) {
    if (!id) return;
    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      this.unwrapResult(await this._callDelete({ id }));
      this.success = "Question deleted.";
      this.pendingDeleteId = null;
      this.pendingDeleteName = null;
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to delete question.";
    } finally {
      this.loading = false;
    }
  }
}

export const registerAdminQuestionsStore = (AlpineInstance: typeof Alpine) => {
  AlpineInstance.store("adminQuestions", new AdminQuestionsStore());
};

export { PAGE_SIZE };
