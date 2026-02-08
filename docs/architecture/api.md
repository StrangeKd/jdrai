# API REST & Gestion des Erreurs

---

## Spécification OpenAPI (résumé)

**Base URL:** `https://api.jdrai.com/v1`

### Auth (Better Auth - `/api/auth/*`)

> Les endpoints auth sont générés automatiquement par Better Auth via `toNodeHandler(auth)`.
> Référence : [API Concepts](https://www.better-auth.com/docs/concepts/api) | [Email/Password](https://www.better-auth.com/docs/authentication/email-password)

| Méthode | Endpoint                    | Description             |
| ------- | --------------------------- | ----------------------- |
| POST    | `/api/auth/sign-up/email`   | Inscription             |
| POST    | `/api/auth/sign-in/email`   | Connexion               |
| POST    | `/api/auth/sign-out`        | Déconnexion             |
| GET     | `/api/auth/session`         | Récupérer session       |
| POST    | `/api/auth/forget-password` | Demande reset (plugin)  |
| POST    | `/api/auth/reset-password`  | Reset password (plugin) |

> **Note** : Les endpoints `forget-password` et `reset-password` nécessitent une configuration email. D'autres endpoints sont ajoutés par les plugins (OAuth, MFA, etc.).

### Users

| Méthode | Endpoint               | Description                |
| ------- | ---------------------- | -------------------------- |
| GET     | `/users/me`            | Profil utilisateur         |
| PATCH   | `/users/me`            | Modifier profil            |
| PATCH   | `/users/me/onboarding` | Marquer onboarding terminé |

> **Onboarding E6-01** : `PATCH /users/me` avec `{ username: "xxx" }` met à jour les champs `username` (JDRAI) **et** `name` (Better Auth) pour remplacer le placeholder `email.split("@")[0]` défini à l'inscription. Le `username` est obligatoire pour accéder au reste de l'app (redirect si absent).

### Meta-Character

| Méthode | Endpoint                       | Description          |
| ------- | ------------------------------ | -------------------- |
| GET     | `/meta-character`              | Récupérer méta-perso |
| POST    | `/meta-character`              | Créer méta-perso     |
| PATCH   | `/meta-character`              | Modifier méta-perso  |
| GET     | `/meta-character/achievements` | Liste achievements   |

### Adventures

| Méthode | Endpoint                     | Description                                  |
| ------- | ---------------------------- | -------------------------------------------- |
| GET     | `/adventures`                | Liste aventures user                         |
| POST    | `/adventures`                | Créer aventure                               |
| GET     | `/adventures/:id`            | Détail aventure                              |
| PATCH   | `/adventures/:id`            | Modifier (pause, abandon, settings)          |
| GET     | `/adventures/:id/messages`   | Historique messages (filtre `?milestoneId=`) |
| GET     | `/adventures/:id/milestones` | Liste milestones de l'aventure               |

> **Note** : L'abandon d'une aventure se fait via `PATCH` avec `{ status: "abandoned" }`, pas via `DELETE`. Une suppression physique n'est pas prévue pour conserver l'historique.

> **Limite aventures** : `POST /adventures` retourne `409 CONFLICT` (code `MAX_ACTIVE_ADVENTURES`) si le joueur a déjà **5 aventures solo actives** (`status = "active"`). Le client doit vérifier cette limite avant d'afficher le formulaire de création (cf. wireframe E9 WF-E9-06).

> **Note Milestones** : `GET /adventures` retourne `currentMilestone` (nom du milestone actif, dérivé) dans chaque `AdventureDTO`. `GET /adventures/:id/milestones` retourne la liste ordonnée des milestones avec leur statut. `GET /adventures/:id/messages?milestoneId=xxx` permet de filtrer les messages par milestone (utilisé par le `HistoryDrawer`).

### Game (WebSocket + REST fallback)

| Méthode | Endpoint                        | Description                                |
| ------- | ------------------------------- | ------------------------------------------ |
| POST    | `/adventures/:id/action`        | Envoyer action joueur                      |
| GET     | `/adventures/:id/state`         | État actuel du jeu (inclut `milestones[]`) |
| POST    | `/adventures/:id/reset-context` | Reset contexte narratif LLM (P2)           |

### Reference Data

| Méthode | Endpoint     | Description         |
| ------- | ------------ | ------------------- |
| GET     | `/classes`   | Liste classes       |
| GET     | `/races`     | Liste races         |
| GET     | `/templates` | Templates aventures |

---

## Format de Réponse Standard

```typescript
// Succès
interface ApiResponse<T> {
  success: true;
  data: T;
}

// Erreur
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

---

## Authentification (Better Auth)

- **Méthode:** Sessions gérées par Better Auth via cookies httpOnly
- **Durée session:** 7 jours (configurable), refresh automatique après 1 jour d'activité
- **Transport:** Cookies httpOnly (pas de tokens exposés au JavaScript)
- **CSRF:** Protection automatique par Better Auth
- **Credentials:** Toutes les requêtes API doivent inclure `credentials: "include"`

---

## Format Erreur API

```typescript
// packages/shared/src/types/api.ts
export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
  };
}

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "MAX_ACTIVE_ADVENTURES"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "LLM_ERROR"
  | "LLM_TIMEOUT";
```

> **Convention localisation** : Le champ `message` est en anglais technique (pour les logs et le debug). Il n'est **jamais** affiché à l'utilisateur. Le frontend utilise le `code` comme clé pour afficher un message localisé (cf. `frontend.md` §Résilience client — Messages d'erreur localisés).

## Error Middleware

```typescript
// apps/api/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.flatten(),
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Unknown error
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      timestamp: new Date().toISOString(),
    },
  });
};
```
