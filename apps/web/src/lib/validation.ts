/**
 * Centralized validation service.
 *
 * Importing this file sets a global Zod error map that provides French,
 * user-friendly error messages for all Zod schemas in the app.
 *
 * Usage:
 *   import { z, fields } from "@/lib/validation";
 *   const schema = z.object({ email: fields.email() });
 */
import { z } from "zod";

z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined" || issue.received === "null") {
        return { message: "Ce champ est requis" };
      }
      return { message: ctx.defaultError };

    case z.ZodIssueCode.too_small:
      if (issue.type === "string") {
        if (issue.minimum === 1) return { message: "Ce champ est requis" };
        return {
          message: `Min. ${issue.minimum} caractère${Number(issue.minimum) > 1 ? "s" : ""}`,
        };
      }
      return { message: ctx.defaultError };

    case z.ZodIssueCode.too_big:
      if (issue.type === "string") {
        return {
          message: `Max. ${issue.maximum} caractère${Number(issue.maximum) > 1 ? "s" : ""}`,
        };
      }
      return { message: ctx.defaultError };

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") return { message: "Adresse email invalide" };
      if (issue.validation === "url") return { message: "URL invalide" };
      return { message: ctx.defaultError };

    default:
      return { message: ctx.defaultError };
  }
});

export { z };

/**
 * Pre-built field validators with consistent French error messages.
 * Use these as building blocks for form schemas.
 */
export const fields = {
  /** Required email field */
  email: () => z.string().email(),

  /** Required password with configurable minimum length (default: 8) */
  password: (min = 8) => z.string().min(min),

  /** Required text field with configurable minimum length (default: 1) */
  requiredString: (max?: number) => {
    const base = z.string().min(1);
    return max !== undefined ? base.max(max) : base;
  },

  /** Optional text field */
  optionalString: () => z.string().optional(),
};
