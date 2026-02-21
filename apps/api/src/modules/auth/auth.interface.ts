import type { UserCreateInput, UserDTO, UserLoginInput } from "@jdrai/shared";

export interface IAuthService {
  register(data: UserCreateInput, headers?: Record<string, string>): Promise<UserDTO>;
  login(data: UserLoginInput, headers?: Record<string, string>): Promise<UserDTO>;
  logout(headers: Record<string, string>): Promise<void>;
  validateSession(headers: Record<string, string>): Promise<UserDTO | null>;
  setUsername(
    headers: Record<string, string>,
    username: string,
  ): Promise<UserDTO>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}
