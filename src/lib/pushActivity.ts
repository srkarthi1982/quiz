const getWebhookUrl = (baseUrl: string) => `${baseUrl.replace(/\/$/, "")}/api/webhooks/quiz-activity.json`;

export const pushQuizActivity = (userId: string, occurredAtISO?: string): void => {
  try {
    const baseUrl = import.meta.env.PARENT_APP_URL;
    const secret = import.meta.env.ANSIVERSA_WEBHOOK_SECRET;

    if (!baseUrl || !secret) {
      if (import.meta.env.DEV) {
        console.warn("pushQuizActivity skipped: missing PARENT_APP_URL or ANSIVERSA_WEBHOOK_SECRET");
      }
      return;
    }

    const url = getWebhookUrl(baseUrl);
    const payload = {
      userId,
      appId: "quiz",
      occurredAt: occurredAtISO ?? new Date().toISOString(),
    };

    void fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ansiversa-Signature": secret,
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("pushQuizActivity failed", error);
    }
  }
};
