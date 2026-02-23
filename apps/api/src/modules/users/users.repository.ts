import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

export const usersRepository = {
  findById: async (userId: string) => {
    return db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  },
};
