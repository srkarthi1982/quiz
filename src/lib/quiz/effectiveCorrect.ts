export type VerificationStatus = "unverified" | "verified" | "flagged" | "unsure";

type EffectiveCorrectInput = {
  options: string[];
  answerKey: string;
  verificationStatus?: VerificationStatus | null;
  verificationSuggestedChoiceIndex?: number | null;
};

export type EffectiveCorrectResult = {
  status: VerificationStatus;
  storedCorrectIndex: number;
  effectiveCorrectIndex: number;
  isProvisional: boolean;
  isDisputed: boolean;
  badgeText: string | null;
};

const isVerificationStatus = (value: unknown): value is VerificationStatus =>
  value === "unverified" || value === "verified" || value === "flagged" || value === "unsure";

const resolveStoredCorrectIndex = (options: string[], answerKey: string) => {
  if (!Array.isArray(options) || options.length === 0) return -1;
  const key = (answerKey || "").trim();
  if (!key) return -1;

  const numericKey = Number.parseInt(key, 10);
  if (!Number.isNaN(numericKey)) {
    if (numericKey >= 0 && numericKey < options.length) return numericKey;
    const zeroBased = numericKey - 1;
    if (zeroBased >= 0 && zeroBased < options.length) return zeroBased;
  }

  if (key.length === 1) {
    const alphaIndex = key.toLowerCase().charCodeAt(0) - 97;
    if (alphaIndex >= 0 && alphaIndex < options.length) return alphaIndex;
  }

  const lowerKey = key.toLowerCase();
  const matchIndex = options.findIndex((option) => option.trim().toLowerCase() === lowerKey);
  return matchIndex >= 0 ? matchIndex : -1;
};

export const resolveEffectiveCorrect = (input: EffectiveCorrectInput): EffectiveCorrectResult => {
  const status: VerificationStatus = isVerificationStatus(input.verificationStatus)
    ? input.verificationStatus
    : "unverified";
  const storedCorrectIndex = resolveStoredCorrectIndex(input.options ?? [], input.answerKey ?? "");
  const hasSuggestedIndex =
    status === "flagged" &&
    Number.isInteger(input.verificationSuggestedChoiceIndex) &&
    Number(input.verificationSuggestedChoiceIndex) >= 0 &&
    Number(input.verificationSuggestedChoiceIndex) < (input.options?.length ?? 0);

  const effectiveCorrectIndex = hasSuggestedIndex
    ? Number(input.verificationSuggestedChoiceIndex)
    : storedCorrectIndex;
  const isDisputed = hasSuggestedIndex && storedCorrectIndex >= 0 && storedCorrectIndex !== effectiveCorrectIndex;
  const isProvisional =
    status === "unverified" || status === "unsure" || (status === "flagged" && !hasSuggestedIndex);

  let badgeText: string | null = null;
  if (hasSuggestedIndex) {
    badgeText = "Answer validated live";
  } else if (isProvisional) {
    badgeText = "Answer check pending";
  }

  return {
    status,
    storedCorrectIndex,
    effectiveCorrectIndex,
    isProvisional,
    isDisputed,
    badgeText,
  };
};
