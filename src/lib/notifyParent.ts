type ParentNotificationPayload = {
  appKey: "quiz";
  userId: string;
  title: string;
  message: string;
  level?: "info" | "success" | "warning" | "error";
  meta?: Record<string, any>;
  createdAt?: string;
};

const resolveNotificationUrl = (baseUrl?: string | null, overrideUrl?: string | null) => {
  if (overrideUrl) return overrideUrl;
  if (!baseUrl) return null;
  return `${baseUrl.replace(/\/$/, "")}/api/webhooks/notifications.json`;
};

export const notifyParent = async (payload: ParentNotificationPayload): Promise<void> => {
  try {
    const baseUrl = import.meta.env.PARENT_APP_URL;
    const overrideUrl = import.meta.env.PARENT_NOTIFICATION_WEBHOOK_URL;
    const secret = import.meta.env.ANSIVERSA_WEBHOOK_SECRET;

    const url = resolveNotificationUrl(baseUrl, overrideUrl);
    if (!url || !secret) {
      if (import.meta.env.DEV) {
        console.warn(
          "notifyParent skipped: missing PARENT_APP_URL/PARENT_NOTIFICATION_WEBHOOK_URL or ANSIVERSA_WEBHOOK_SECRET",
        );
      }
      return;
    }

    const body = {
      appKey: payload.appKey,
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      level: payload.level ?? "info",
      meta: payload.meta ?? null,
      createdAt: payload.createdAt ?? new Date().toISOString(),
    };

    void fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ansiversa-Signature": secret,
      },
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("notifyParent failed", error);
    }
  }
};
