import type { UserDTO } from "@jdrai/shared";

import { auth } from "@/lib/auth";
import { AppError } from "@/utils/errors";

import { mapDbUserToDTO } from "./users.dto";
import { usersRepository } from "./users.repository";
import type { UpdateUserInput } from "./users.schema";
import { isUsernameTakenError, normalizeUpdateInput } from "./users.utils";

export const usersService = {
  updateMe: async (
    userId: string,
    headers: Record<string, string>,
    input: UpdateUserInput,
  ): Promise<UserDTO> => {
    try {
      const result = await auth.api.updateUser({
        body: normalizeUpdateInput(input),
        headers,
      });
      if (!result?.status) {
        throw new AppError(500, "INTERNAL_ERROR", "Failed to update user");
      }

      // Fetch fresh user from DB (bypasses Better Auth cookie cache TTL)
      const updated = await usersRepository.findById(userId);
      if (!updated) {
        throw new AppError(404, "NOT_FOUND", "User not found");
      }
      return mapDbUserToDTO(updated);
    } catch (err) {
      if (isUsernameTakenError(err)) {
        throw new AppError(409, "USERNAME_TAKEN", "Username is already taken");
      }
      throw err;
    }
  },
};
