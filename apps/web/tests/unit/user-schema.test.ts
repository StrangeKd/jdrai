import { describe, expect, it } from "vitest";

import { usernameSchema, userUpdateSchema } from "@jdrai/shared";

describe("usernameSchema (packages/shared)", () => {
  it("accepts a valid username", () => {
    expect(usernameSchema.safeParse("Aldric_42").success).toBe(true);
  });

  it("rejects username shorter than 3 characters", () => {
    const r = usernameSchema.safeParse("ab");
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues[0]?.message).toContain("3");
  });

  it("rejects username longer than 20 characters", () => {
    const r = usernameSchema.safeParse("a".repeat(21));
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.issues[0]?.message).toContain("20");
  });

  it("rejects username with spaces", () => {
    expect(usernameSchema.safeParse("Hello World").success).toBe(false);
  });

  it("rejects username with special chars other than underscore", () => {
    expect(usernameSchema.safeParse("hello!").success).toBe(false);
    expect(usernameSchema.safeParse("hello-world").success).toBe(false);
  });

  it("accepts username with letters, numbers and underscores", () => {
    expect(usernameSchema.safeParse("Player_1").success).toBe(true);
    expect(usernameSchema.safeParse("ABC123").success).toBe(true);
    expect(usernameSchema.safeParse("abc").success).toBe(true);
  });
});

describe("userUpdateSchema (packages/shared)", () => {
  it("accepts a valid username field", () => {
    expect(userUpdateSchema.safeParse({ username: "Aldric" }).success).toBe(true);
  });

  it("accepts an empty object (username is optional)", () => {
    expect(userUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("rejects invalid username when provided", () => {
    expect(userUpdateSchema.safeParse({ username: "ab" }).success).toBe(false);
  });
});
