import type Alpine from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";

export type AdminSubjectItem = {
  id: number;
  platformId: number;
  name: string;
  isActive: boolean;
  qCount: number;
  platformName?: string | null;
};

export type AdminSubjectPlatform = {
  id: number;
  name: string;
};

export type AdminSubjectsSort =
  | "id"
  | "name"
  | "platformName"
  | "platformId"
  | "qCount"
  | "status";
export type AdminSubjectsDir = "asc" | "desc";

const PAGE_SIZE = 10;

const defaultForm = () => ({
  platformId: "",
  name: "",
  qCount: 0,
  isActive: true,
});

const defaultState = () => ({
  items: [] as AdminSubjectItem[],
  platforms: [] as AdminSubjectPlatform[],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  q: "",
  platformId: "",
  status: "all",
  sort: "id" as AdminSubjectsSort,
  dir: "desc" as AdminSubjectsDir,
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

export class AdminSubjectsStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  items: AdminSubjectItem[] = [];
  platforms: AdminSubjectPlatform[] = [];
  total = 0;
  page = 1;
  pageSize = PAGE_SIZE;
  q = "";
  platformId = "";
  status = "all";
  sort: AdminSubjectsSort = "id";
  dir: AdminSubjectsDir = "desc";
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
    this.status = initial.status ?? "all";
    this.sort = (initial.sort ?? "id") as AdminSubjectsSort;
    this.dir = (initial.dir ?? "desc") as AdminSubjectsDir;
    this.items = (initial.items ?? []) as AdminSubjectItem[];
    this.platforms = (initial.platforms ?? []) as AdminSubjectPlatform[];
    this.form = {
      ...defaultForm(),
      ...(initial.form ?? {}),
    };
  }

  private async _callList(payload: any) {
    const a: any = actions as any;
    if (a?.fetchSubjects) return await a.fetchSubjects(payload);
    if (a?.quiz?.fetchSubjects) return await a.quiz.fetchSubjects(payload);
    throw new Error("fetchSubjects action not found.");
  }

  private async _callCreate(payload: any) {
    const a: any = actions as any;
    if (a?.createSubject) return await a.createSubject(payload);
    if (a?.quiz?.createSubject) return await a.quiz.createSubject(payload);
    throw new Error("createSubject action not found.");
  }

  private async _callUpdate(payload: any) {
    const a: any = actions as any;
    if (a?.updateSubject) return await a.updateSubject(payload);
    if (a?.quiz?.updateSubject) return await a.quiz.updateSubject(payload);
    throw new Error("updateSubject action not found.");
  }

  private async _callDelete(payload: any) {
    const a: any = actions as any;
    if (a?.deleteSubject) return await a.deleteSubject(payload);
    if (a?.quiz?.deleteSubject) return await a.quiz.deleteSubject(payload);
    throw new Error("deleteSubject action not found.");
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
      this.items = (data?.items ?? []) as AdminSubjectItem[];
      this.total = Number(data?.total ?? this.items.length ?? 0);
      this.page = Math.max(1, Number(data?.page ?? this.page));
      this.pageSize = Math.max(1, Number(data?.pageSize ?? this.pageSize));
    } catch (err: any) {
      this.error = err?.message || "Failed to load subjects.";
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
    this.sort = (value || "id") as AdminSubjectsSort;
    this.dir = nextDir;
    this.page = 1;
    this.load();
  }

  resetFilters() {
    this.q = "";
    this.platformId = "";
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

  openEdit(subject: AdminSubjectItem) {
    this.drawerOpen = true;
    this.drawerMode = "edit";
    this.editingId = subject?.id ?? null;
    this.form = {
      platformId: subject?.platformId ? String(subject.platformId) : "",
      name: subject?.name ?? "",
      qCount: subject?.qCount ?? 0,
      isActive: subject?.isActive ?? true,
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
    const qCountRaw = Number(this.form?.qCount ?? 0);
    const qCount = Number.isFinite(qCountRaw) ? Math.max(0, qCountRaw) : 0;
    const isActive = !!this.form?.isActive;

    if (!Number.isFinite(platformId) || platformId <= 0) {
      return { error: "Platform is required." };
    }
    if (!name) return { error: "Subject name is required." };

    return { platformId, name, qCount, isActive } as const;
  }

  async submit() {
    const validated = this.validateForm();
    if ((validated as any).error) {
      this.error = (validated as any).error;
      return;
    }

    const payload = validated as {
      platformId: number;
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
        this.success = "Subject updated.";
      } else {
        this.unwrapResult(await this._callCreate(payload));
        this.success = "Subject created.";
      }

      this.closeDrawer();
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to save subject.";
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
      this.success = "Subject deleted.";
      this.pendingDeleteId = null;
      this.pendingDeleteName = null;
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to delete subject.";
    } finally {
      this.loading = false;
    }
  }
}

export const registerAdminSubjectsStore = (AlpineInstance: typeof Alpine) => {
  AlpineInstance.store("adminSubjects", new AdminSubjectsStore());
};

export { PAGE_SIZE };
