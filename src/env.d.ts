/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
    readonly BASE_URL: string
    readonly ENVIRONMENT: string
    readonly SUPABASE_URL: string
    readonly SUPABASE_ANON_KEY: string
    readonly SUPABASE_SERVICE_KEY: string
    readonly OPENAI_API_KEY: string
  }
  interface Window {
    Alpine: import('alpinejs').Alpine;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
declare namespace App {
  interface Locals {
    user: any;
    email: string;
    roleId: number;
    roleName: string;
    accessCodes: string[];
    storeId: string;
    storeName: string;
    packageId: number;
    packageName: string;
    adLimit: number;
    menus: any;
    schemas: any;
  }
}
