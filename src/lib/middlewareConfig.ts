export type RouteProtectionMode = "protectMost" | "protectPrefixes";

interface MiddlewareConfig {
  routeProtection: {
    mode: RouteProtectionMode;
    publicRoutes: ReadonlySet<string>;
    protectedPrefixes: readonly string[];
    apiBypassRoutes: ReadonlySet<string>;
  };
  extraPublicPathPrefixes: readonly string[];
  devBypass: {
    enabled: boolean;
    envSource: "import-meta" | "process";
    allowPaidBypass: boolean;
    warnOnPaidBypass: boolean;
    defaultUserId: string;
    defaultEmail: string;
    defaultRoleId: number;
  };
}

export const middlewareConfig: MiddlewareConfig = {
  routeProtection: {
    mode: "protectMost",
    publicRoutes: new Set(["/"]),
    protectedPrefixes: ["/app", "/admin"],
    apiBypassRoutes: new Set(["/api/flashnote/questions", "/api/flashnote/sources", "/api/faqs.json"]),
  },
  extraPublicPathPrefixes: [],
  devBypass: {
    enabled: false,
    envSource: "import-meta",
    allowPaidBypass: false,
    warnOnPaidBypass: false,
    defaultUserId: "dev-user",
    defaultEmail: "dev@local",
    defaultRoleId: 1,
  },
};
