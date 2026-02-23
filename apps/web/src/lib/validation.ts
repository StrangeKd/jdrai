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

z.config({
  customError: (issue) => {
    switch (issue.code) {
      case "invalid_type": {
        if (issue.input === undefined || issue.input === null) return "Ce champ est requis";
        return undefined;
      }

      case "too_small": {
        if (issue.origin !== "string") return undefined;
        if (issue.minimum === 1) return "Ce champ est requis";
        return `Min. ${issue.minimum} caractère${Number(issue.minimum) > 1 ? "s" : ""}`;
      }

      case "too_big": {
        if (issue.origin !== "string") return undefined;
        return `Max. ${issue.maximum} caractère${Number(issue.maximum) > 1 ? "s" : ""}`;
      }

      default:
        return undefined;
    }
  },
});

export { z };

/**
 * Pre-built field validators with consistent French error messages.
 * Use these as building blocks for form schemas.
 */
export const fields = {
  /** Required email field */
  email: () => z.email("Adresse email invalide"),

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
