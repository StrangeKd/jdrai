import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  loginSearchSchema,
  registerSchema,
  resetPasswordSchema,
  resetSearchSchema,
} from "@/schemas/auth";

describe("auth schemas", () => {
  it("loginSchema validates required fields", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = result.error.flatten().fieldErrors;
    expect(errors.email?.[0]).toBe("Ce champ est requis");
    expect(errors.password?.[0]).toBe("Mot de passe requis");
  });

  it("registerSchema requires 8+ chars password", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = result.error.flatten().fieldErrors;
    expect(errors.password?.[0]).toBe("Min. 8 caractères");
  });

  it("registerSchema requires confirmPassword to match", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "long-enough",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = result.error.flatten().fieldErrors;
    expect(errors.confirmPassword?.[0]).toBe("Les mots de passe ne correspondent pas");
  });
});

describe("forgotPasswordSchema", () => {
  it("rejects empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = result.error.flatten().fieldErrors;
    expect(errors.email?.[0]).toBe("Adresse email invalide");
  });

  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("rejects password shorter than 8 chars", () => {
    const result = resetPasswordSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = result.error.flatten().fieldErrors;
    expect(errors.password?.[0]).toBe("Min. 8 caractères");
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "long-enough",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = result.error.flatten().fieldErrors;
    expect(errors.confirmPassword?.[0]).toBe("Les mots de passe ne correspondent pas");
  });

  it("accepts matching passwords of 8+ chars", () => {
    const result = resetPasswordSchema.safeParse({
      password: "securepass",
      confirmPassword: "securepass",
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSearchSchema", () => {
  it("parses empty search as both optional fields undefined", () => {
    const result = loginSearchSchema.parse({});
    expect(result.reset).toBeUndefined();
    expect(result.redirect).toBeUndefined();
  });

  it("parses reset=success", () => {
    const result = loginSearchSchema.parse({ reset: "success" });
    expect(result.reset).toBe("success");
  });

  it("ignores invalid reset value", () => {
    const result = loginSearchSchema.parse({ reset: "nope" });
    expect(result.reset).toBeUndefined();
  });

  it("parses redirect string", () => {
    const result = loginSearchSchema.parse({ redirect: "/hub" });
    expect(result.redirect).toBe("/hub");
  });

  it("ignores external redirect URLs (open-redirect protection)", () => {
    const result = loginSearchSchema.parse({ redirect: "https://evil.example/phish" });
    expect(result.redirect).toBeUndefined();
  });

  it("ignores protocol-relative redirects", () => {
    const result = loginSearchSchema.parse({ redirect: "//evil.example/phish" });
    expect(result.redirect).toBeUndefined();
  });

  it("ignores redirects to auth routes (loop protection)", () => {
    const result = loginSearchSchema.parse({ redirect: "/auth/login" });
    expect(result.redirect).toBeUndefined();
  });
});

describe("resetSearchSchema", () => {
  it("defaults token to empty string when absent", () => {
    const result = resetSearchSchema.parse({});
    expect(result.token).toBe("");
  });

  it("preserves valid token string", () => {
    const result = resetSearchSchema.parse({ token: "abc123" });
    expect(result.token).toBe("abc123");
  });
});

