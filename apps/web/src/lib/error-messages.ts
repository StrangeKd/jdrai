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
};

export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INTERNAL_ERROR;
}
