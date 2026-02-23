import type { UserDTO } from "@jdrai/shared";

import { auth } from "@/lib/auth";
import { AppError } from "@/utils/errors";

import { mapDbUserToDTO } from "./users.dto";
import { usersRepository } from "./users.repository";
import type { UpdateUserInput } from "./users.schema";
import { isUsernameTakenError, normalizeUpdateInput } from "./users.utils";

export type UpdateMeResult = {
  user: UserDTO;
  // Set-Cookie header from Better Auth — must be forwarded to the client so the
  // browser refreshes its cookieCache (maxAge: 5 min) with the updated session data.
  setCookie: string | null;
};

export const usersService = {
  updateMe: async (
    userId: string,
    headers: Record<string, string>,
    input: UpdateUserInput,
  ): Promise<UpdateMeResult> => {
    try {
      const response = await auth.api.updateUser({
        body: normalizeUpdateInput(input),
        headers,
        asResponse: true,
      });
      if (!response.ok) {
        throw new AppError(500, "INTERNAL_ERROR", "Failed to update user");
      }

      // Fetch fresh user from DB (bypasses Better Auth cookie cache TTL)
      const updated = await usersRepository.findById(userId);
      if (!updated) {
        throw new AppError(404, "NOT_FOUND", "User not found");
      }
      return {
        user: mapDbUserToDTO(updated),
        setCookie: response.headers.get("set-cookie"),
      };
    } catch (err) {
      if (isUsernameTakenError(err)) {
        throw new AppError(409, "USERNAME_TAKEN", "Username is already taken");
      }
      throw err;
    }
  },
};
