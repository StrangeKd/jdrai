import { z } from "zod";

import { userUpdateSchema } from "@jdrai/shared";

export const updateUserSchema = userUpdateSchema.extend({
  // Support Better Auth's "name" field updates, while sharing username rules.
  name: z.string().min(1).max(50).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
