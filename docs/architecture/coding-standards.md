# Coding Standards

**Version:** 1.0
**Date:** 2026-02-08

---

## Comments

- All code comments (inline, block, JSDoc) must be written in **English**.

---

## TypeScript

### Configuration

- `strict: true` obligatoire dans tous les `tsconfig.json`
- `noUncheckedIndexedAccess: true` — force la vérification des accès par index
- `exactOptionalProperties: true` — distingue `undefined` de propriété absente
- Target : `ES2022` (support natif Node 20+)

### Types vs Interfaces

| Utiliser        | Quand                                                   |
| --------------- | ------------------------------------------------------- |
| **`interface`** | DTOs, contrats API, props composants, abstractions      |
| **`type`**      | Unions, intersections, types utilitaires, types dérivés |

```typescript
// ✅ Interface pour un contrat
interface IAuthService {
  login(data: UserLoginInput): Promise<AuthResult>;
}

// ✅ Type pour une union
type AdventureStatus = "active" | "completed" | "abandoned";

// ✅ Type pour un dérivé
type AdventureKeys = keyof AdventureDTO;
```

### Règles strictes

- **Pas de `any`** — utiliser `unknown` puis narrower, ou un type générique
- **Pas de `as` cast** — sauf pour les assertions nécessaires (ex : `as const`)
- **Pas d'enums TS** — utiliser des unions de string littérales + `pgEnum` côté Drizzle
- **Pas de `!` (non-null assertion)** — sauf dans les fichiers de config (`process.env.DATABASE_URL!`)
- **Exporter les types** depuis `packages/shared` — jamais de type défini localement s'il traverse une boundary API

---

## Naming

### Fichiers

| Élément              | Convention              | Exemple                |
| -------------------- | ----------------------- | ---------------------- |
| Composants React     | PascalCase              | `UserProfile.tsx`      |
| Hooks                | camelCase + use         | `useAuth.ts`           |
| Services             | camelCase + .service    | `auth.service.ts`      |
| Controllers          | camelCase + .controller | `game.controller.ts`   |
| Interfaces           | camelCase + .interface  | `auth.interface.ts`    |
| Middleware           | camelCase + .middleware | `auth.middleware.ts`   |
| Schémas Zod          | camelCase + .schema     | `adventure.schema.ts`  |
| Schémas Drizzle      | camelCase (pluriel)     | `adventures.ts`        |
| Tests                | \*.test.ts              | `auth.service.test.ts` |
| Fichiers TS généraux | camelCase               | `gameUtils.ts`         |
| Constants            | camelCase + .constants  | `game.constants.ts`    |

### Code

| Élément     | Convention                    | Exemple                 |
| ----------- | ----------------------------- | ----------------------- |
| Variables   | camelCase                     | `adventureCount`        |
| Fonctions   | camelCase                     | `createAdventure()`     |
| Classes     | PascalCase                    | `BetterAuthService`     |
| Interfaces  | PascalCase + I (abstractions) | `IAuthService`          |
| DTOs        | PascalCase + DTO              | `AdventureDTO`          |
| Inputs      | PascalCase + Input            | `AdventureCreateInput`  |
| Constantes  | UPPER_SNAKE                   | `MAX_ACTIVE_ADVENTURES` |
| Types union | PascalCase                    | `AdventureStatus`       |
| Routes API  | kebab-case                    | `/meta-character`       |
| Tables DB   | snake_case                    | `adventure_characters`  |
| Colonnes DB | snake_case                    | `onboarding_completed`  |

> **Préfixe `I`** : Réservé aux interfaces d'abstraction (service contracts). Les DTOs et props n'utilisent pas de préfixe.

---

## Structure des Modules Backend

Chaque module dans `apps/api/src/modules/` suit cette structure :

```
modules/
└── adventures/
    ├── adventure.controller.ts   # Routes Express (req/res uniquement)
    ├── adventure.service.ts      # Logique métier
    ├── adventure.repository.ts   # Accès DB (Drizzle queries)
    └── adventure.validation.ts   # Schémas Zod pour les inputs
```

### Responsabilités

| Couche         | Responsabilité                           | Interdit                             |
| -------------- | ---------------------------------------- | ------------------------------------ |
| **Controller** | Parse req, appelle service, retourne res | Logique métier, accès DB direct      |
| **Service**    | Logique métier, orchestration            | Accès `req`/`res`, queries DB direct |
| **Repository** | Requêtes Drizzle, mapping DB → DTO       | Logique métier, accès HTTP           |
| **Validation** | Schémas Zod pour les inputs              | Logique, side effects                |

### Pattern Controller

```typescript
// ✅ Controller = thin layer
export const adventureController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = adventureCreateSchema.parse(req.body);
      const adventure = await adventureService.create(req.user!.id, input);
      res.status(201).json({ success: true, data: adventure });
    } catch (error) {
      next(error);
    }
  },
};
```

### Pattern Service

```typescript
// ✅ Service = logique métier
export const adventureService = {
  create: async (userId: string, input: AdventureCreateInput): Promise<AdventureDTO> => {
    const activeCount = await adventureRepository.countActive(userId);
    if (activeCount >= MAX_ACTIVE_ADVENTURES) {
      throw new AppError(409, "MAX_ACTIVE_ADVENTURES", "User has reached max active adventures");
    }
    return adventureRepository.create(userId, input);
  },
};
```

### Pattern Repository

```typescript
// ✅ Repository = accès données uniquement
export const adventureRepository = {
  countActive: async (userId: string): Promise<number> => {
    const result = await db
      .select({ count: count() })
      .from(adventures)
      .where(and(eq(adventures.userId, userId), eq(adventures.status, "active")));
    return result[0].count;
  },
};
```

---

## Validation (Zod)

- **Tout input API** doit être validé par un schéma Zod
- Les schémas vivent dans `packages/shared/src/schemas/` (partagés front/back)
- Utiliser `drizzle-zod` pour générer les schémas de base depuis les tables Drizzle
- Enrichir manuellement les schémas générés (messages d'erreur, contraintes business)

```typescript
// packages/shared/src/schemas/adventure.schema.ts
import { z } from "zod";

export const adventureCreateSchema = z.object({
  templateId: z.string().uuid().optional(),
  title: z.string().min(1).max(100).optional(),
  difficulty: z.enum(["easy", "normal", "hard", "nightmare"]),
  tone: z.enum(["serious", "humorous", "epic", "dark"]).optional(),
  estimatedDuration: z.enum(["short", "medium", "long"]),
});

export type AdventureCreateInput = z.infer<typeof adventureCreateSchema>;
```

### Validation Middleware

```typescript
// Utilisation dans les routes
import { validate } from "../middleware/validation.middleware";
import { adventureCreateSchema } from "@jdrai/shared";

router.post("/", validate(adventureCreateSchema), adventureController.create);
```

---

## Error Handling

### AppError

```typescript
// apps/api/src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
```

### Règles

- **Toujours** throw `AppError` avec un `code` du type `ErrorCode` (cf. `api.md`)
- **Jamais** de `res.status().json()` dans un catch — laisser le `errorHandler` middleware gérer
- **Jamais** afficher `error.message` à l'utilisateur côté frontend — mapper via `ErrorCode`
- **Toujours** `next(error)` dans les controllers pour propager au middleware
- **Zod errors** sont interceptées automatiquement par le `errorHandler` middleware

---

## Format de Réponse API

```typescript
// ✅ Succès
res.json({ success: true, data: adventure });

// ✅ Succès avec liste
res.json({ success: true, data: adventures });

// ✅ Création
res.status(201).json({ success: true, data: adventure });

// ✅ Pas de contenu
res.status(204).send();
```

Le format erreur est géré automatiquement par le `errorHandler` middleware.

---

## Composants React

### Structure d'un composant

```typescript
// 1. Imports
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// 2. Types (si spécifiques au composant)
interface AdventureCardProps {
  adventure: AdventureDTO;
  onResume: (id: string) => void;
}

// 3. Composant (named export)
export function AdventureCard({ adventure, onResume }: AdventureCardProps) {
  // hooks en premier
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // handlers
  const handleResume = () => onResume(adventure.id);

  // render
  return (/* JSX */);
}
```

### Règles

- **Named exports** pour les composants — pas de `export default`
- **Un composant par fichier** — sauf les sous-composants internes non exportés
- **Props typées** via `interface` dédiée — pas d'inline
- **Pas de logique métier dans le JSX** — extraire dans des variables ou hooks
- **shadcn/ui** comme base — ne pas réinventer les composants de base

### Hooks personnalisés

- Préfixe `use` obligatoire
- Un hook = une responsabilité
- Retourner un objet nommé (pas un tableau) si > 2 valeurs

```typescript
// ✅
export function useAdventure(id: string) {
  return { adventure, isLoading, error, resume, abandon };
}

// ❌
export function useAdventure(id: string) {
  return [adventure, isLoading, error, resume, abandon];
}
```

---

## State Management

| Type de state | Outil          | Exemple                             |
| ------------- | -------------- | ----------------------------------- |
| Server state  | TanStack Query | Aventures, messages, profil         |
| Auth state    | Better Auth    | Session, user                       |
| UI state      | Zustand        | Thème, sidebar, préférences locales |

### TanStack Query

- **Query keys** structurées en tableau : `["adventures", id]`, `["adventures", id, "messages"]`
- **Mutations** via `useMutation` — jamais de fetch direct dans un handler
- **Invalidation** ciblée après mutation : `queryClient.invalidateQueries({ queryKey: ["adventures"] })`
- **Pas de state local** pour les données serveur — TanStack Query est la source de vérité

---

## Imports

### Ordre (appliqué par ESLint)

1. Modules Node.js natifs (`node:fs`, `node:path`)
2. Packages externes (`react`, `express`, `zod`)
3. Alias monorepo (`@jdrai/shared`)
4. Alias locaux (`@/components`, `@/hooks`, `@/services`)
5. Imports relatifs (`./utils`, `../types`)

### Alias

| Alias           | Cible                              | Contexte      |
| --------------- | ---------------------------------- | ------------- |
| `@jdrai/shared` | `packages/shared/src`              | Partout       |
| `@/`            | `apps/web/src/` ou `apps/api/src/` | Local à l'app |

---

## Variables d'Environnement

- **Jamais** accéder directement à `process.env` dans le code métier
- **Toujours** passer par un objet config typé et validé au démarrage

```typescript
// apps/api/src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  API_PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // ...
});

export const env = envSchema.parse(process.env);
```

- **Frontend** : préfixe `VITE_` obligatoire, accès via `import.meta.env.VITE_*`

---

## Sécurité

| Règle                      | Détail                                                      |
| -------------------------- | ----------------------------------------------------------- |
| **Validation inputs**      | Zod sur tous les endpoints sans exception                   |
| **Pas de secrets en code** | `.env` uniquement, jamais hardcodé                          |
| **SQL injection**          | Drizzle ORM uniquement — pas de raw SQL sauf `sql` tagged   |
| **XSS**                    | React échappe par défaut — pas de `dangerouslySetInnerHTML` |
| **CORS**                   | Whitelist stricte (`trustedOrigins`)                        |
| **Sessions**               | Cookies httpOnly — pas de tokens en localStorage/JS         |
| **Credentials**            | `credentials: "include"` sur toutes les requêtes API        |

---

## Git

### Branches

| Type    | Format                   | Exemple                    |
| ------- | ------------------------ | -------------------------- |
| Feature | `feature/<epic>-<story>` | `feature/E1-auth-register` |
| Bugfix  | `fix/<description>`      | `fix/session-expiry`       |
| Hotfix  | `hotfix/<description>`   | `hotfix/login-crash`       |

### Commits

Format : `<type>(<scope>): <description>`

| Type       | Usage                                   |
| ---------- | --------------------------------------- |
| `feat`     | Nouvelle fonctionnalité                 |
| `fix`      | Correction de bug                       |
| `refactor` | Refactoring sans changement fonctionnel |
| `test`     | Ajout/modification de tests             |
| `docs`     | Documentation                           |
| `chore`    | Maintenance, dépendances, CI            |
| `style`    | Formatting, lint                        |

Exemples :

```
feat(auth): add email/password registration
fix(game): handle LLM timeout in streaming
refactor(api): extract adventure repository
test(auth): add integration tests for sign-up
```

### PR

- Titre court (< 70 caractères)
- Description avec contexte, changements, et plan de test
- Une PR = une story ou un fix isolé
- Review obligatoire avant merge

---

## ESLint & Prettier

- **ESLint** : config partagée à la racine du monorepo, extensions par app
- **Prettier** : config unique à la racine
- **Pas de `// eslint-disable`** sans justification en commentaire
- **Pre-commit hook** (lint-staged) : lint + format automatique

### Config Prettier (référence)

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

---

**Document généré via BMAD Method — Phase Architecture**
