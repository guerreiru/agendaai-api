import { AppError } from "./app-error";

export function normalizePhoneToE164(phone: string): string {
  const trimmed = phone.trim();

  // Keep only digits and an optional leading plus.
  let normalized = trimmed.replace(/[\s().-]/g, "");

  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  }

  if (!normalized.startsWith("+")) {
    if (!/^\d+$/.test(normalized)) {
      throw new AppError("The phone format is invalid.", 400);
    }
    normalized = `+${normalized}`;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new AppError("The phone format is invalid. Use E.164 format.", 400);
  }

  return normalized;
}
