import type { ErrorCode } from "@jdrai/shared";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Factory for common AppError instances.
 * Centralises error messages and codes to avoid duplication across modules.
 */
export const AppErrors = {
  adventureNotFound: () => new AppError(404, "NOT_FOUND", "Adventure not found"),
  notYourAdventure: () => new AppError(403, "FORBIDDEN", "Not your adventure"),
  characterNotFound: () => new AppError(404, "NOT_FOUND", "Character not found"),
  userNotFound: () => new AppError(404, "NOT_FOUND", "User not found"),
  adventureNotActive: () =>
    new AppError(400, "ADVENTURE_NOT_ACTIVE", "Cannot act on a completed adventure"),
  validationFailed: (msg: string) => new AppError(400, "VALIDATION_ERROR", msg),
} as const;
