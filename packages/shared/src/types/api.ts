export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "USERNAME_TAKEN"
  | "MAX_ACTIVE_ADVENTURES"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "LLM_ERROR"
  | "LLM_TIMEOUT"
  | "ADVENTURE_NOT_ACTIVE"
  | "INVALID_TRANSITION";

export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}
