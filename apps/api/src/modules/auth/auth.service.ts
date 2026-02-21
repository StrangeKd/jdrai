import type { UserCreateInput, UserDTO, UserLoginInput } from "@jdrai/shared";

import { auth } from "@/lib/auth";
import { AppError } from "@/utils/errors";

import { type BetterAuthUser, mapBetterAuthUserToDTO } from "./auth.dto";
import type { IAuthService } from "./auth.interface";

export class BetterAuthService implements IAuthService {
  async register(
    data: UserCreateInput,
    headers?: Record<string, string>,
  ): Promise<UserDTO> {
    const name = data.email.split("@").at(0) ?? data.email;
    const result = await auth.api.signUpEmail({
      body: { email: data.email, password: data.password, name },
      ...(headers ? { headers } : {}),
    });
    if (!result?.user) {
      throw new AppError(500, "INTERNAL_ERROR", "Registration failed");
    }
    return mapBetterAuthUserToDTO(result.user as BetterAuthUser);
  }

  async login(
    data: UserLoginInput,
    headers?: Record<string, string>,
  ): Promise<UserDTO> {
    const result = await auth.api.signInEmail({
      body: { email: data.email, password: data.password },
      ...(headers ? { headers } : {}),
    });
    if (!result?.user) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid credentials");
    }
    return mapBetterAuthUserToDTO(result.user as BetterAuthUser);
  }

  async logout(headers: Record<string, string>): Promise<void> {
    await auth.api.signOut({ headers });
  }

  async validateSession(
    headers: Record<string, string>,
  ): Promise<UserDTO | null> {
    const session = await auth.api.getSession({ headers });
    if (!session?.user) return null;
    return mapBetterAuthUserToDTO(session.user as BetterAuthUser);
  }

  async setUsername(
    headers: Record<string, string>,
    username: string,
  ): Promise<UserDTO> {
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

  async requestPasswordReset(email: string): Promise<void> {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await auth.api.resetPassword({
      body: { token, newPassword },
    });
  }
}

export const authService = new BetterAuthService();
