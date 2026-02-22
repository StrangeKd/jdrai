import type { UserDTO } from "@jdrai/shared";

/**
 * Server-side auth operations not covered by Better Auth's direct endpoints.
 * Auth flows (register, login, logout, password reset) are handled by Better Auth
 * at /api/auth/* — the frontend calls these directly via the Better Auth client.
 */
export interface IAuthService {
  setUsername(headers: Record<string, string>, username: string): Promise<UserDTO>;
}
