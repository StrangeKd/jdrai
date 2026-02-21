import type { UserDTO } from "@jdrai/shared";

import { toISOString } from "../../utils/http";

export type BetterAuthUser = Record<string, unknown> & {
  id: string;
  email: string;
  createdAt: Date | string;
};

export function mapBetterAuthUserToDTO(user: BetterAuthUser): UserDTO {
  return {
    id: user.id,
    email: user.email,
    username: typeof user.username === "string" ? user.username : null,
    role: user.role === "admin" ? "admin" : "user",
    onboardingCompleted: user.onboardingCompleted === true,
    createdAt: toISOString(user.createdAt),
  };
}
