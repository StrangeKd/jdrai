import type { UserDTO } from "@jdrai/shared";

export interface IAuthService {
  register(email: string, password: string): Promise<UserDTO>;
  login(email: string, password: string): Promise<UserDTO>;
  logout(headers: Record<string, string>): Promise<void>;
  validateSession(headers: Record<string, string>): Promise<UserDTO | null>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}
