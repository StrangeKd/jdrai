import { z } from "zod";

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric with underscores")
    .optional(),
  name: z.string().min(1).max(50).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
