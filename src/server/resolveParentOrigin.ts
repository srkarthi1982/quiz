const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");

const firstNonEmpty = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

export const resolveParentOrigin = (locals?: App.Locals) => {
  if (import.meta.env.PROD) {
    return "https://www.ansiversa.com";
  }

  const raw = firstNonEmpty(
    locals?.rootAppUrl,
    import.meta.env.PARENT_WEB_ORIGIN,
    import.meta.env.WEB_ORIGIN,
    import.meta.env.PUBLIC_WEB_ORIGIN,
    import.meta.env.PUBLIC_ROOT_APP_URL,
    import.meta.env.PARENT_APP_URL,
    import.meta.env.DEV ? "http://localhost:2000" : "https://www.ansiversa.com",
  );

  if (!raw) {
    return "http://localhost:2000";
  }

  try {
    const parsed = new URL(trimTrailingSlash(raw));
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return trimTrailingSlash(raw);
  }
};
