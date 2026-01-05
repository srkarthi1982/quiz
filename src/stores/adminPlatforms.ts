import type Alpine from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";

export type AdminPlatformItem = {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  type?: string | null;
  qCount: number;
  isActive: boolean;
};

export type AdminPlatformsSort = "id" | "name" | "description" | "type" | "qCount" | "status";
export type AdminPlatformsDir = "asc" | "desc";

const PAGE_SIZE = 10;

const defaultForm = () => ({
  name: "",
  description: "",
  icon: "",
  type: "",
  qCount: 0,
  isActive: true,
});

const defaultState = () => ({
  items: [] as AdminPlatformItem[],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  q: "",
  typeFilter: "",
  status: "all",
  sort: "id" as AdminPlatformsSort,
  dir: "desc" as AdminPlatformsDir,
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

export class AdminPlatformsStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  items: AdminPlatformItem[] = [];
  total = 0;
  page = 1;
  pageSize = PAGE_SIZE;
  q = "";
  typeFilter = "";
  status = "all";
  sort: AdminPlatformsSort = "id";
  dir: AdminPlatformsDir = "desc";
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
    this.typeFilter = initial.typeFilter ?? "";
    this.status = initial.status ?? "all";
    this.sort = (initial.sort ?? "id") as AdminPlatformsSort;
    this.dir = (initial.dir ?? "desc") as AdminPlatformsDir;
    this.items = (initial.items ?? []) as AdminPlatformItem[];
    this.form = {
      ...defaultForm(),
      ...(initial.form ?? {}),
    };
  }

  private async _callList(payload: any) {
    const a: any = actions as any;
    if (a?.fetchPlatforms) return await a.fetchPlatforms(payload);
    if (a?.quiz?.fetchPlatforms) return await a.quiz.fetchPlatforms(payload);
    throw new Error("fetchPlatforms action not found.");
  }

  private async _callCreate(payload: any) {
    const a: any = actions as any;
    if (a?.createPlatform) return await a.createPlatform(payload);
    if (a?.quiz?.createPlatform) return await a.quiz.createPlatform(payload);
    throw new Error("createPlatform action not found.");
  }

  private async _callUpdate(payload: any) {
    const a: any = actions as any;
    if (a?.updatePlatform) return await a.updatePlatform(payload);
    if (a?.quiz?.updatePlatform) return await a.quiz.updatePlatform(payload);
    throw new Error("updatePlatform action not found.");
  }

  private async _callDelete(payload: any) {
    const a: any = actions as any;
    if (a?.deletePlatform) return await a.deletePlatform(payload);
    if (a?.quiz?.deletePlatform) return await a.quiz.deletePlatform(payload);
    throw new Error("deletePlatform action not found.");
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
    if (this.typeFilter) filters.type = this.typeFilter;
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
      this.items = (data?.items ?? []) as AdminPlatformItem[];
      this.total = Number(data?.total ?? this.items.length ?? 0);
      this.page = Math.max(1, Number(data?.page ?? this.page));
      this.pageSize = Math.max(1, Number(data?.pageSize ?? this.pageSize));
    } catch (err: any) {
      this.error = err?.message || "Failed to load platforms.";
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

  setType(value: string) {
    this.typeFilter = value ?? "";
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
    this.sort = (value || "id") as AdminPlatformsSort;
    this.dir = nextDir;
    this.page = 1;
    this.load();
  }

  resetFilters() {
    this.q = "";
    this.typeFilter = "";
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

  openEdit(platform: AdminPlatformItem) {
    this.drawerOpen = true;
    this.drawerMode = "edit";
    this.editingId = platform?.id ?? null;
    this.form = {
      name: platform?.name ?? "",
      description: platform?.description ?? "",
      icon: platform?.icon ?? "",
      type: platform?.type ?? "",
      qCount: platform?.qCount ?? 0,
      isActive: platform?.isActive ?? true,
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
    const description = (this.form?.description || "").trim();
    const icon = (this.form?.icon || "").trim();
    const typeRaw = (this.form?.type || "").trim();
    const qCountRaw = Number(this.form?.qCount ?? 0);
    const qCount = Number.isFinite(qCountRaw) ? Math.max(0, qCountRaw) : 0;
    const isActive = !!this.form?.isActive;

    if (!name) return { error: "Platform name is required." };

    return {
      name,
      description,
      icon,
      type: typeRaw || null,
      qCount,
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
      name: string;
      description: string;
      icon: string;
      type: string | null;
      qCount: number;
      isActive: boolean;
    };

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      if (this.editingId) {
        this.unwrapResult(await this._callUpdate({ id: this.editingId, data: payload }));
        this.success = "Platform updated.";
      } else {
        this.unwrapResult(await this._callCreate(payload));
        this.success = "Platform created.";
      }

      this.closeDrawer();
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to save platform.";
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
      this.success = "Platform deleted.";
      this.pendingDeleteId = null;
      this.pendingDeleteName = null;
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to delete platform.";
    } finally {
      this.loading = false;
    }
  }
}

export const registerAdminPlatformsStore = (AlpineInstance: typeof Alpine) => {
  AlpineInstance.store("adminPlatforms", new AdminPlatformsStore());
};

export { PAGE_SIZE };
