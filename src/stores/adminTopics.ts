import type Alpine from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";

export type AdminTopicItem = {
  id: number;
  platformId: number;
  subjectId: number;
  name: string;
  isActive: boolean;
  qCount: number;
  platformName?: string | null;
  subjectName?: string | null;
};

export type AdminTopicPlatform = {
  id: number;
  name: string;
};

export type AdminTopicSubject = {
  id: number;
  name: string;
  platformId: number;
};

export type AdminTopicsSort =
  | "id"
  | "name"
  | "subjectName"
  | "platformName"
  | "platformId"
  | "subjectId"
  | "qCount"
  | "status";
export type AdminTopicsDir = "asc" | "desc";

const PAGE_SIZE = 10;

const defaultForm = () => ({
  platformId: "",
  subjectId: "",
  name: "",
  qCount: 0,
  isActive: true,
});

const defaultState = () => ({
  items: [] as AdminTopicItem[],
  platforms: [] as AdminTopicPlatform[],
  subjects: [] as AdminTopicSubject[],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  q: "",
  platformId: "",
  subjectId: "",
  status: "all",
  sort: "id" as AdminTopicsSort,
  dir: "desc" as AdminTopicsDir,
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

export class AdminTopicsStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  items: AdminTopicItem[] = [];
  platforms: AdminTopicPlatform[] = [];
  subjects: AdminTopicSubject[] = [];
  total = 0;
  page = 1;
  pageSize = PAGE_SIZE;
  q = "";
  platformId = "";
  subjectId = "";
  status = "all";
  sort: AdminTopicsSort = "id";
  dir: AdminTopicsDir = "desc";
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
    this.status = initial.status ?? "all";
    this.sort = (initial.sort ?? "id") as AdminTopicsSort;
    this.dir = (initial.dir ?? "desc") as AdminTopicsDir;
    this.items = (initial.items ?? []) as AdminTopicItem[];
    this.platforms = (initial.platforms ?? []) as AdminTopicPlatform[];
    this.subjects = (initial.subjects ?? []) as AdminTopicSubject[];
    this.form = {
      ...defaultForm(),
      ...(initial.form ?? {}),
    };
  }

  private async _callList(payload: any) {
    const a: any = actions as any;
    if (a?.fetchTopics) return await a.fetchTopics(payload);
    if (a?.quiz?.fetchTopics) return await a.quiz.fetchTopics(payload);
    throw new Error("fetchTopics action not found.");
  }

  private async _callCreate(payload: any) {
    const a: any = actions as any;
    if (a?.createTopic) return await a.createTopic(payload);
    if (a?.quiz?.createTopic) return await a.quiz.createTopic(payload);
    throw new Error("createTopic action not found.");
  }

  private async _callUpdate(payload: any) {
    const a: any = actions as any;
    if (a?.updateTopic) return await a.updateTopic(payload);
    if (a?.quiz?.updateTopic) return await a.quiz.updateTopic(payload);
    throw new Error("updateTopic action not found.");
  }

  private async _callDelete(payload: any) {
    const a: any = actions as any;
    if (a?.deleteTopic) return await a.deleteTopic(payload);
    if (a?.quiz?.deleteTopic) return await a.quiz.deleteTopic(payload);
    throw new Error("deleteTopic action not found.");
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

    if (this.q) filters.name = this.q;
    if (this.platformId) filters.platformId = Number(this.platformId);
    if (this.subjectId) filters.subjectId = Number(this.subjectId);
    if (this.status === "active" || this.status === "inactive") {
      filters.status = this.status;
    }

    return Object.keys(filters).length ? filters : undefined;
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
      this.items = (data?.items ?? []) as AdminTopicItem[];
      this.total = Number(data?.total ?? this.items.length ?? 0);
      this.page = Math.max(1, Number(data?.page ?? this.page));
      this.pageSize = Math.max(1, Number(data?.pageSize ?? this.pageSize));
    } catch (err: any) {
      this.error = err?.message || "Failed to load topics.";
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
    this.page = 1;
    this.load();
  }

  setSubject(value: string) {
    this.subjectId = value ?? "";
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
    this.sort = (value || "id") as AdminTopicsSort;
    this.dir = nextDir;
    this.page = 1;
    this.load();
  }

  resetFilters() {
    this.q = "";
    this.platformId = "";
    this.subjectId = "";
    this.status = "all";
    this.sort = "id";
    this.dir = "desc";
    this.page = 1;
    this.load();
  }

  goToPage(n: number) {
    const next = Math.min(Math.max(Number(n || 1), 1), this.totalPages);
    if (next === this.page) return;
    this.page = next;
    this.load();
  }

  openCreate() {
    this.drawerOpen = true;
    this.drawerMode = "create";
    this.editingId = null;
    this.form = defaultForm();
    this.error = null;
    this.success = null;
  }

  openEdit(topic: AdminTopicItem) {
    this.drawerOpen = true;
    this.drawerMode = "edit";
    this.editingId = topic?.id ?? null;
    this.form = {
      platformId: topic?.platformId ? String(topic.platformId) : "",
      subjectId: topic?.subjectId ? String(topic.subjectId) : "",
      name: topic?.name ?? "",
      qCount: topic?.qCount ?? 0,
      isActive: topic?.isActive ?? true,
    };
    this.error = null;
    this.success = null;
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.drawerMode = "create";
    this.editingId = null;
    this.form = defaultForm();
    this.error = null;
  }

  private validateForm() {
    const name = (this.form?.name || "").trim();
    const platformId = Number(this.form?.platformId || 0);
    const subjectId = Number(this.form?.subjectId || 0);
    const qCountRaw = Number(this.form?.qCount ?? 0);
    const qCount = Number.isFinite(qCountRaw) ? Math.max(0, qCountRaw) : 0;
    const isActive = !!this.form?.isActive;

    if (!Number.isFinite(platformId) || platformId <= 0) {
      return { error: "Platform is required." };
    }
    if (!Number.isFinite(subjectId) || subjectId <= 0) {
      return { error: "Subject is required." };
    }
    if (!name) return { error: "Topic name is required." };

    return { platformId, subjectId, name, qCount, isActive } as const;
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
      name: string;
      qCount: number;
      isActive: boolean;
    };

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      if (this.editingId) {
        this.unwrapResult(await this._callUpdate({ id: this.editingId, ...payload }));
        this.success = "Topic updated.";
      } else {
        this.unwrapResult(await this._callCreate(payload));
        this.success = "Topic created.";
      }

      this.closeDrawer();
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to save topic.";
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
      this.success = "Topic deleted.";
      this.pendingDeleteId = null;
      this.pendingDeleteName = null;
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to delete topic.";
    } finally {
      this.loading = false;
    }
  }
}

export const registerAdminTopicsStore = (AlpineInstance: typeof Alpine) => {
  AlpineInstance.store("adminTopics", new AdminTopicsStore());
};

export { PAGE_SIZE };
