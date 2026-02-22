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

