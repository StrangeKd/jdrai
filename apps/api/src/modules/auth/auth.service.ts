import type { UserDTO } from "@jdrai/shared";

import { auth } from "../../lib/auth";
import { AppError } from "../../utils/errors";
import type { IAuthService } from "./auth.interface";

type BetterAuthUser = Record<string, unknown> & {
  id: string;
  email: string;
  createdAt: Date;
};

function mapToDTO(user: BetterAuthUser): UserDTO {
  return {
    id: user.id,
    email: user.email,
    username: (user.username as string | null) ?? null,
    role: ((user.role as "user" | "admin") ?? "user"),
    onboardingCompleted: (user.onboardingCompleted as boolean) ?? false,
    createdAt: user.createdAt instanceof Date
      ? user.createdAt.toISOString()
      : (user.createdAt as string),
  };
}

export class BetterAuthService implements IAuthService {
  async register(email: string, password: string): Promise<UserDTO> {
    const name = email.split("@").at(0) ?? email;
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
    });
    if (!result?.user) {
      throw new AppError(500, "INTERNAL_ERROR", "Registration failed");
    }
    return mapToDTO(result.user as BetterAuthUser);
  }

  async login(email: string, password: string): Promise<UserDTO> {
    const result = await auth.api.signInEmail({
      body: { email, password },
    });
    if (!result?.user) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid credentials");
    }
    return mapToDTO(result.user as BetterAuthUser);
  }

  async logout(headers: Record<string, string>): Promise<void> {
    await auth.api.signOut({ headers });
  }

  async validateSession(
    headers: Record<string, string>,
  ): Promise<UserDTO | null> {
    const session = await auth.api.getSession({ headers });
    if (!session?.user) return null;
    return mapToDTO(session.user as BetterAuthUser);
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
