import type { UserDTO } from "@jdrai/shared";

import { auth } from "@/lib/auth";
import { AppError } from "@/utils/errors";

import { type BetterAuthUser, mapBetterAuthUserToDTO } from "./auth.dto";
import type { IAuthService } from "./auth.interface";

/**
 * Server-side auth service — handles JDRAI-specific operations that go through
 * the Express API (/api/v1/users/*). Auth flows (register, login, logout, password
 * reset) are handled by Better Auth directly at /api/auth/* and are not proxied here.
 */
export class BetterAuthService implements IAuthService {
  async setUsername(headers: Record<string, string>, username: string): Promise<UserDTO> {
    const result = await auth.api.updateUser({
      body: { username, name: username },
      headers,
    });
    if (!result?.status) {
      throw new AppError(500, "INTERNAL_ERROR", "Failed to update user");
    }
    const session = await auth.api.getSession({ headers });
    if (!session?.user) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid session");
    }
    return mapBetterAuthUserToDTO(session.user as BetterAuthUser);
  }
}

export const authService = new BetterAuthService();
