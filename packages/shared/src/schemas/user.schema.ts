import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Le pseudo doit contenir au moins 3 caractères")
  .max(20, "Le pseudo ne peut pas dépasser 20 caractères")
  .regex(/^[a-zA-Z0-9_]+$/, "Le pseudo ne peut contenir que des lettres, chiffres et _");

export const userUpdateSchema = z.object({
  username: usernameSchema.optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
