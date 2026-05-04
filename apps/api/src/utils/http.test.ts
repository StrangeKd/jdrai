import { describe, expect, it } from "vitest";

import { getCurrentISOString, toISOStringOrUndefined } from "./http.js";

describe("getCurrentISOString", () => {
  it("returns a valid ISO 8601 string", () => {
    const result = getCurrentISOString();
    expect(typeof result).toBe("string");
    expect(new Date(result).toISOString()).toBe(result);
  });

  it("is close to the current time", () => {
    const before = Date.now();
    const result = getCurrentISOString();
    const after = Date.now();
    const ts = new Date(result).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe("toISOStringOrUndefined", () => {
  it("converts a Date to an ISO string", () => {
    const date = new Date("2025-01-15T12:00:00.000Z");
    expect(toISOStringOrUndefined(date)).toBe("2025-01-15T12:00:00.000Z");
  });

  it("returns undefined for null", () => {
    expect(toISOStringOrUndefined(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(toISOStringOrUndefined(undefined)).toBeUndefined();
  });
});
