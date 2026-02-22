import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "@/lib/auth-schemas";

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

