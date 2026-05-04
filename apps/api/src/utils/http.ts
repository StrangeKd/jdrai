import type { Request } from "express";

/**
 * Returns the current UTC timestamp as an ISO 8601 string.
 * Prefer this over `new Date().toISOString()` for consistency.
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Converts a nullable/undefined Date to an ISO 8601 string, or returns `undefined`.
 * Prefer this over optional-chaining `.toISOString()` in DTO mappers.
 */
export function toISOStringOrUndefined(date: Date | null | undefined): string | undefined {
  if (date == null) return undefined;
  return date.toISOString();
}

export function toRecordStringHeaders(headers: Request["headers"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") out[key] = value;
    else if (Array.isArray(value)) out[key] = value.join(", ");
  }
  return out;
}

export function toISOString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toISOString();
  }
  if (value === null || value === undefined) return new Date(0).toISOString();
  const asString = String(value);
  const d = new Date(asString);
  return Number.isNaN(d.getTime()) ? asString : d.toISOString();
}
