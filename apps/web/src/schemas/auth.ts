import { sanitizeRedirectPath } from "@/lib/redirects";
import { z } from "@/lib/validation";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Ce champ est requis")
    .email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Ce champ est requis")
      .email("Adresse email invalide"),
    password: z.string().min(8, "Min. 8 caractères"),
    confirmPassword: z.string().min(1, "Ce champ est requis"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// Forgot password form schema (E3)
export const forgotPasswordSchema = z.object({
  email: z.string().min(1).email(),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// Reset password form schema (E4)
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// Login route search params (also used by Story 2.4 auth guard)
export const loginSearchSchema = z.object({
  // Keep route resilient: invalid values are ignored instead of throwing.
  reset: z.preprocess(
    (v) => (v === "success" ? "success" : undefined),
    z.enum(["success"]).optional(),
  ),
  redirect: z.preprocess((v) => sanitizeRedirectPath(v), z.string().optional()),
});
export type LoginSearch = z.infer<typeof loginSearchSchema>;

// Reset password route search params
export const resetSearchSchema = z.object({
  token: z.string().catch(""),
});
export type ResetSearch = z.infer<typeof resetSearchSchema>;
