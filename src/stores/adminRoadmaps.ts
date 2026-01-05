import type Alpine from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";

export type AdminRoadmapItem = {
  id: number;
  platformId: number;
  subjectId: number;
  topicId: number;
  name: string;
  isActive: boolean;
  qCount: number;
  platformName?: string | null;
  subjectName?: string | null;
  topicName?: string | null;
};

export type AdminRoadmapPlatform = {
  id: number;
  name: string;
};

export type AdminRoadmapSubject = {
  id: number;
  name: string;
  platformId: number;
};

export type AdminRoadmapTopic = {
  id: number;
  name: string;
  platformId: number;
  subjectId: number;
};

export type AdminRoadmapsSort =
  | "id"
  | "name"
  | "platformName"
  | "subjectName"
  | "topicName"
  | "platformId"
  | "subjectId"
  | "topicId"
  | "qCount"
  | "status";
export type AdminRoadmapsDir = "asc" | "desc";

const PAGE_SIZE = 10;

const defaultForm = () => ({
  platformId: "",
  subjectId: "",
  topicId: "",
  name: "",
  qCount: 0,
  isActive: true,
});

const defaultState = () => ({
  items: [] as AdminRoadmapItem[],
  platforms: [] as AdminRoadmapPlatform[],
  subjects: [] as AdminRoadmapSubject[],
  topics: [] as AdminRoadmapTopic[],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  q: "",
  platformId: "",
  subjectId: "",
  topicId: "",
  status: "all",
  sort: "id" as AdminRoadmapsSort,
  dir: "desc" as AdminRoadmapsDir,
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

export class AdminRoadmapsStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  items: AdminRoadmapItem[] = [];
  platforms: AdminRoadmapPlatform[] = [];
  subjects: AdminRoadmapSubject[] = [];
  topics: AdminRoadmapTopic[] = [];
  total = 0;
  page = 1;
  pageSize = PAGE_SIZE;
  q = "";
  platformId = "";
  subjectId = "";
  topicId = "";
  status = "all";
  sort: AdminRoadmapsSort = "id";
  dir: AdminRoadmapsDir = "desc";
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
    this.status = initial.status ?? "all";
    this.sort = (initial.sort ?? "id") as AdminRoadmapsSort;
    this.dir = (initial.dir ?? "desc") as AdminRoadmapsDir;
    this.items = (initial.items ?? []) as AdminRoadmapItem[];
    this.platforms = (initial.platforms ?? []) as AdminRoadmapPlatform[];
    this.subjects = (initial.subjects ?? []) as AdminRoadmapSubject[];
    this.topics = (initial.topics ?? []) as AdminRoadmapTopic[];
    this.form = {
      ...defaultForm(),
      ...(initial.form ?? {}),
    };
  }

  private async _callList(payload: any) {
    const a: any = actions as any;
    if (a?.fetchRoadmaps) return await a.fetchRoadmaps(payload);
    if (a?.quiz?.fetchRoadmaps) return await a.quiz.fetchRoadmaps(payload);
    throw new Error("fetchRoadmaps action not found.");
  }

  private async _callCreate(payload: any) {
    const a: any = actions as any;
    if (a?.createRoadmap) return await a.createRoadmap(payload);
    if (a?.quiz?.createRoadmap) return await a.quiz.createRoadmap(payload);
    throw new Error("createRoadmap action not found.");
  }

  private async _callUpdate(payload: any) {
    const a: any = actions as any;
    if (a?.updateRoadmap) return await a.updateRoadmap(payload);
    if (a?.quiz?.updateRoadmap) return await a.quiz.updateRoadmap(payload);
    throw new Error("updateRoadmap action not found.");
  }

  private async _callDelete(payload: any) {
    const a: any = actions as any;
    if (a?.deleteRoadmap) return await a.deleteRoadmap(payload);
    if (a?.quiz?.deleteRoadmap) return await a.quiz.deleteRoadmap(payload);
    throw new Error("deleteRoadmap action not found.");
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
    if (this.topicId) filters.topicId = Number(this.topicId);
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
      this.items = (data?.items ?? []) as AdminRoadmapItem[];
      this.total = Number(data?.total ?? this.items.length ?? 0);
      this.page = Math.max(1, Number(data?.page ?? this.page));
      this.pageSize = Math.max(1, Number(data?.pageSize ?? this.pageSize));
    } catch (err: any) {
      this.error = err?.message || "Failed to load roadmaps.";
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
    this.page = 1;
    this.load();
  }

  setSubject(value: string) {
    this.subjectId = value ?? "";
    if (this.topicId) this.topicId = "";
    this.page = 1;
    this.load();
  }

  setTopic(value: string) {
    this.topicId = value ?? "";
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
    this.sort = (value || "id") as AdminRoadmapsSort;
    this.dir = nextDir;
    this.page = 1;
    this.load();
  }

  resetFilters() {
    this.q = "";
    this.platformId = "";
    this.subjectId = "";
    this.topicId = "";
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

  openEdit(roadmap: AdminRoadmapItem) {
    this.drawerOpen = true;
    this.drawerMode = "edit";
    this.editingId = roadmap?.id ?? null;
    this.form = {
      platformId: roadmap?.platformId ? String(roadmap.platformId) : "",
      subjectId: roadmap?.subjectId ? String(roadmap.subjectId) : "",
      topicId: roadmap?.topicId ? String(roadmap.topicId) : "",
      name: roadmap?.name ?? "",
      qCount: roadmap?.qCount ?? 0,
      isActive: roadmap?.isActive ?? true,
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
    const topicId = Number(this.form?.topicId || 0);
    const qCountRaw = Number(this.form?.qCount ?? 0);
    const qCount = Number.isFinite(qCountRaw) ? Math.max(0, qCountRaw) : 0;
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
    if (!name) return { error: "Roadmap name is required." };

    return { platformId, subjectId, topicId, name, qCount, isActive } as const;
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
        this.success = "Roadmap updated.";
      } else {
        this.unwrapResult(await this._callCreate(payload));
        this.success = "Roadmap created.";
      }

      this.closeDrawer();
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to save roadmap.";
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
      this.success = "Roadmap deleted.";
      this.pendingDeleteId = null;
      this.pendingDeleteName = null;
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to delete roadmap.";
    } finally {
      this.loading = false;
    }
  }
}

export const registerAdminRoadmapsStore = (AlpineInstance: typeof Alpine) => {
  AlpineInstance.store("adminRoadmaps", new AdminRoadmapsStore());
};

export { PAGE_SIZE };
