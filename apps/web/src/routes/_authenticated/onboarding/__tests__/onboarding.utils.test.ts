import { beforeEach, describe, expect, it } from "vitest";

import {
  hasSeenWelcome,
  markWelcomeSeen,
  WELCOME_SEEN_STORAGE_KEY,
} from "@/routes/_authenticated/onboarding/onboarding.utils";
import { getNoUsernameOnboardingTarget } from "@/routes/routing.utils";

describe("onboarding storage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to not-seen for unknown userId", () => {
    expect(hasSeenWelcome("u1")).toBe(false);
    expect(getNoUsernameOnboardingTarget("u1")).toBe("/onboarding/welcome");
  });

  it("marks welcome as seen per-user and persists", () => {
    markWelcomeSeen("u1");
    expect(hasSeenWelcome("u1")).toBe(true);
    expect(getNoUsernameOnboardingTarget("u1")).toBe("/onboarding/profile-setup");

    const raw = window.localStorage.getItem(WELCOME_SEEN_STORAGE_KEY);
    expect(raw).toContain("u1");
  });

  it("does not treat other users as seen", () => {
    markWelcomeSeen("u1");
    expect(hasSeenWelcome("u2")).toBe(false);
    expect(getNoUsernameOnboardingTarget("u2")).toBe("/onboarding/welcome");
  });
});
