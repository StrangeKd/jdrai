import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatRelativeTime } from "@/lib/utils";

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns \"à l'instant\" for < 1 minute ago", () => {
    const date = new Date("2025-01-01T11:59:30Z").toISOString();
    expect(formatRelativeTime(date)).toBe("à l'instant");
  });

  it("returns minutes for 1–59 minutes ago", () => {
    const date = new Date("2025-01-01T11:30:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("il y a 30 min");
  });

  it("returns hours for 1–23 hours ago", () => {
    const date = new Date("2025-01-01T09:00:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("il y a 3h");
  });

  it("returns days for 1–6 days ago", () => {
    const date = new Date("2024-12-29T12:00:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("il y a 3 j.");
  });

  it("returns weeks for 7+ days ago", () => {
    const date = new Date("2024-12-18T12:00:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("il y a 2 sem.");
  });

  it("returns a future string when date is in the future", () => {
    const date = new Date("2025-01-01T12:05:00Z").toISOString();
    expect(formatRelativeTime(date)).toBe("dans 5 min");
  });
});
