import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

export const usersRepository = {
  findById: async (userId: string) => {
    return db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  },

  /**
   * Updates the onboarding_completed flag for a user.
   * Called after tutorial completion (game.service.ts) to mark onboarding done.
   */
  updateOnboardingStatus: async (userId: string, completed: boolean): Promise<void> => {
    await db
      .update(users)
      .set({ onboardingCompleted: completed })
      .where(eq(users.id, userId));
  },
};
