import type { ErrorCode } from "@jdrai/shared";

// User-facing French messages — never expose raw API error.message to users
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Données invalides.",
  UNAUTHORIZED: "Veuillez vous connecter.",
  FORBIDDEN: "Accès refusé.",
  NOT_FOUND: "Ressource introuvable.",
  CONFLICT: "Conflit avec une donnée existante.",
  USERNAME_TAKEN: "Ce pseudo est déjà pris.",
  MAX_ACTIVE_ADVENTURES: "Vous avez atteint la limite de 5 aventures actives.",
  RATE_LIMITED: "Trop de requêtes, veuillez patienter…",
  INTERNAL_ERROR: "Une erreur inattendue est survenue.",
  LLM_ERROR: "Le MJ rencontre des difficultés…",
  LLM_TIMEOUT: "Le MJ met trop de temps à répondre…",
  ADVENTURE_NOT_ACTIVE: "Cette aventure est déjà terminée.",
};

const ERROR_CODES = new Set<ErrorCode>(Object.keys(ERROR_MESSAGES) as ErrorCode[]);

export function isErrorCode(value: string): value is ErrorCode {
  return ERROR_CODES.has(value as ErrorCode);
}

export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INTERNAL_ERROR;
}

// Better Auth client error codes → French user-facing messages.
// Covers errors thrown by useAuth (register, login) that are not API-level ErrorCodes.
// better-call auto-generates the code from the message:
// message.toUpperCase().replace(/ /g, "_").replace(/[^A-Z0-9_]/g, "")
// "User already exists. Use another email." → "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
const BETTER_AUTH_REGISTER_MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Cette adresse e-mail est déjà utilisée.",
};

export function getRegisterErrorMessage(code?: string): string {
  return (
    (code && BETTER_AUTH_REGISTER_MESSAGES[code]) ??
    "Erreur lors de l'inscription. Veuillez réessayer."
  );
}
