# JDRAI - Document d'Architecture Fullstack

**Version:** 1.0
**Date:** 2026-02-05
**Statut:** Draft
**Auteur:** Architect (BMAD Method)

---

## 1. Introduction

Ce document définit l'architecture complète de JDRAI, une plateforme de jeu de rôle avec MJ IA. Il sert de source de vérité pour le développement, couvrant le backend, le frontend et leur intégration.

### 1.1 Projet Greenfield

N/A - Projet greenfield, aucun starter template utilisé.

### 1.2 Change Log

| Date       | Version | Description      | Auteur    |
| :--------- | :------ | :--------------- | :-------- |
| 2026-02-05 | 1.0     | Version initiale | Architect |

---

## 2. Architecture Haut Niveau

### 2.1 Résumé Technique

JDRAI adopte une **architecture monorepo fullstack** avec séparation claire entre l'API Express et le frontend React SPA. Le backend gère l'authentification JWT, la persistance PostgreSQL via Drizzle ORM, et l'intégration multi-provider LLM pour le MJ IA. Le frontend utilise TanStack Router pour le routing type-safe et TanStack Query pour la gestion du cache serveur. Les types sont partagés via un package interne, garantissant la cohérence des contrats API sans coupler le frontend à l'ORM.

### 2.2 Plateforme et Infrastructure

**Plateforme cible:** Self-hosted / VPS (flexibilité maximale)

| Service              | Technologie           | Justification                     |
| -------------------- | --------------------- | --------------------------------- |
| Hébergement API      | Docker / VPS          | Contrôle total, coûts prévisibles |
| Hébergement Frontend | CDN / Static hosting  | Performance, cache edge           |
| Base de données      | PostgreSQL (Docker)   | ACID, JSON support, maturité      |
| Cache                | Redis (optionnel P2+) | Sessions, rate limiting           |

**Déploiement initial:** Docker Compose (dev/staging), migration vers Kubernetes possible en scale-up.

### 2.3 Structure du Repository

```
Structure: Monorepo
Outil: Turborepo + pnpm workspaces
Organisation: apps/ + packages/
```

### 2.4 Diagramme d'Architecture

```mermaid
flowchart TB
    subgraph Client
        WEB[React SPA<br/>app.jdrai.com]
    end

    subgraph External
        WEBFLOW[Webflow<br/>jdrai.com]
        LLM[LLM Providers<br/>OpenAI / Anthropic / etc.]
    end

    subgraph Backend
        API[Express API<br/>api.jdrai.com]
        WS[Socket.io<br/>WebSocket Server]
    end

    subgraph Data
        PG[(PostgreSQL)]
        REDIS[(Redis<br/>optionnel)]
    end

    WEBFLOW -->|redirect /app| WEB
    WEB -->|REST API| API
    WEB <-->|WebSocket| WS
    API --> PG
    API --> REDIS
    API -->|Streaming| LLM
    WS --> PG
```

### 2.5 Patterns Architecturaux

| Pattern                | Description                    | Justification                                  |
| ---------------------- | ------------------------------ | ---------------------------------------------- |
| **Monorepo**           | Code partagé entre apps        | DX, cohérence des types, refactoring simplifié |
| **SPA + API séparée**  | Frontend découplé du backend   | Déploiement indépendant, scalabilité           |
| **Repository Pattern** | Abstraction accès données      | Testabilité, changement d'ORM possible         |
| **Service Layer**      | Logique métier isolée          | Réutilisabilité, tests unitaires               |
| **DTO Pattern**        | Objets de transfert explicites | Découplage DB/API, sécurité                    |
| **Provider Pattern**   | Abstraction LLM                | Multi-provider, fallback                       |

---

## 3. Stack Technique

### 3.1 Table des Technologies

| Catégorie              | Technologie       | Version | Rôle                 | Justification                      |
| :--------------------- | :---------------- | :------ | :------------------- | :--------------------------------- |
| **Monorepo**           | Turborepo         | ^2.x    | Orchestration builds | Cache, parallélisation, DX         |
| **Package Manager**    | pnpm              | ^9.x    | Gestion dépendances  | Workspaces natifs, performance     |
| **Langage**            | TypeScript        | ^5.x    | Typage               | Sécurité, DX, partage de types     |
| **Frontend Framework** | React             | ^18.x   | UI                   | Écosystème, TanStack compat        |
| **Build Tool**         | Vite              | ^5.x    | Bundling frontend    | HMR rapide, ESM natif              |
| **Routing**            | TanStack Router   | ^1.x    | Navigation type-safe | Type inference, file-based         |
| **Data Fetching**      | TanStack Query    | ^5.x    | Cache serveur        | Stale-while-revalidate, mutations  |
| **UI Components**      | shadcn/ui         | latest  | Design system        | Accessible, customizable, Tailwind |
| **Styling**            | Tailwind CSS      | ^3.x    | Utilitaires CSS      | Productivité, bundle optimisé      |
| **Formulaires**        | React Hook Form   | ^7.x    | Gestion forms        | Performance, validation            |
| **Validation**         | Zod               | ^3.x    | Schémas runtime      | Inférence TS, partage front/back   |
| **Backend Framework**  | Express           | ^4.x    | API HTTP             | Maturité, middleware ecosystem     |
| **ORM**                | Drizzle           | ^0.30+  | Accès BDD            | Type-safe, SQL-like, léger         |
| **Schema Gen**         | drizzle-zod       | ^0.5+   | Génération Zod       | Sync schémas DB/validation         |
| **Base de données**    | PostgreSQL        | 16.x    | Persistance          | ACID, JSONB, performances          |
| **Auth**               | Passport.js + JWT | latest  | Authentification     | Stratégies flexibles               |
| **Temps réel**         | Socket.io         | ^4.x    | WebSocket            | Rooms, reconnexion auto            |
| **Tests Unit**         | Vitest            | ^1.x    | Tests rapides        | Vite compat, ESM natif             |
| **Tests E2E**          | Playwright        | ^1.x    | Tests navigateur     | Multi-browser, fiable              |
| **Linting**            | ESLint + Prettier | latest  | Qualité code         | Standards, formatting              |

---

## 4. Modèles de Données

### 4.1 Vue d'Ensemble

```mermaid
erDiagram
    User ||--o{ Adventure : owns
    User ||--|| MetaCharacter : has
    Adventure ||--o{ AdventureCharacter : contains
    Adventure ||--o{ Message : logs
    Adventure }o--|| AdventureTemplate : "based_on?"
    MetaCharacter ||--o{ Achievement : unlocks
    AdventureCharacter }o--|| CharacterClass : has
    AdventureCharacter }o--|| Race : has

    User {
        uuid id PK
        string email UK
        string passwordHash
        string username
        enum role
        boolean onboardingCompleted
        timestamp createdAt
        timestamp updatedAt
    }

    MetaCharacter {
        uuid id PK
        uuid userId FK
        string name
        string avatarUrl
        string background
        int level
        int xp
        jsonb cosmetics
        timestamp createdAt
    }

    Adventure {
        uuid id PK
        uuid userId FK
        uuid templateId FK "nullable"
        string title
        enum status "active|paused|completed|abandoned"
        enum difficulty
        enum tone
        jsonb settings
        jsonb state "game state snapshot"
        timestamp startedAt
        timestamp lastPlayedAt
        timestamp completedAt
    }

    AdventureCharacter {
        uuid id PK
        uuid adventureId FK
        uuid classId FK
        uuid raceId FK
        string name
        string background
        jsonb stats
        jsonb inventory
        int currentHp
        int maxHp
    }

    Message {
        uuid id PK
        uuid adventureId FK
        enum role "user|assistant|system"
        text content
        jsonb metadata
        timestamp createdAt
    }

    CharacterClass {
        uuid id PK
        string name
        string description
        jsonb baseStats
    }

    Race {
        uuid id PK
        string name
        string description
        jsonb traits
    }

    AdventureTemplate {
        uuid id PK
        string name
        string description
        enum genre
        enum estimatedDuration
        jsonb initialPrompt
        boolean isPublic
    }

    Achievement {
        uuid id PK
        uuid metaCharacterId FK
        string code
        string name
        timestamp unlockedAt
    }
```

### 4.2 Interfaces TypeScript (DTOs - `packages/shared`)

```typescript
// packages/shared/src/types/user.ts
export interface UserDTO {
  id: string;
  email: string;
  username: string;
  role: "user" | "admin";
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface UserCreateInput {
  email: string;
  username: string;
  password: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}
```

```typescript
// packages/shared/src/types/adventure.ts
export type AdventureStatus = "active" | "paused" | "completed" | "abandoned";
export type Difficulty = "easy" | "normal" | "hard" | "nightmare";
export type Tone = "serious" | "humorous" | "epic" | "dark";

export interface AdventureDTO {
  id: string;
  title: string;
  status: AdventureStatus;
  difficulty: Difficulty;
  tone: Tone;
  startedAt: string;
  lastPlayedAt: string;
  character: AdventureCharacterDTO;
}

export interface AdventureCreateInput {
  templateId?: string;
  title: string;
  difficulty: Difficulty;
  tone: Tone;
  character: AdventureCharacterCreateInput;
}

export interface AdventureCharacterDTO {
  id: string;
  name: string;
  className: string;
  raceName: string;
  stats: CharacterStats;
  currentHp: number;
  maxHp: number;
}

export interface AdventureCharacterCreateInput {
  name: string;
  classId: string;
  raceId: string;
  background: string;
  stats: CharacterStats;
}

export interface CharacterStats {
  strength: number;
  agility: number;
  charisma: number;
  karma: number;
}
```

```typescript
// packages/shared/src/types/game.ts
export type MessageRole = "user" | "assistant" | "system";

export interface GameMessageDTO {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  choices?: SuggestedAction[];
}

export interface SuggestedAction {
  id: string;
  label: string;
  type: "suggested" | "custom";
}

export interface PlayerActionInput {
  adventureId: string;
  action: string;
  choiceId?: string; // if selecting a suggested action
}

export interface GameStateDTO {
  adventure: AdventureDTO;
  messages: GameMessageDTO[];
  isStreaming: boolean;
}
```

---

## 5. API REST

### 5.1 Spécification OpenAPI (résumé)

**Base URL:** `https://api.jdrai.com/v1`

#### Auth

| Méthode | Endpoint                | Description      |
| ------- | ----------------------- | ---------------- |
| POST    | `/auth/register`        | Inscription      |
| POST    | `/auth/login`           | Connexion        |
| POST    | `/auth/refresh`         | Rafraîchir token |
| POST    | `/auth/logout`          | Déconnexion      |
| POST    | `/auth/forgot-password` | Demande reset    |
| POST    | `/auth/reset-password`  | Reset password   |

#### Users

| Méthode | Endpoint               | Description                |
| ------- | ---------------------- | -------------------------- |
| GET     | `/users/me`            | Profil utilisateur         |
| PATCH   | `/users/me`            | Modifier profil            |
| PATCH   | `/users/me/onboarding` | Marquer onboarding terminé |

#### Meta-Character

| Méthode | Endpoint                       | Description          |
| ------- | ------------------------------ | -------------------- |
| GET     | `/meta-character`              | Récupérer méta-perso |
| POST    | `/meta-character`              | Créer méta-perso     |
| PATCH   | `/meta-character`              | Modifier méta-perso  |
| GET     | `/meta-character/achievements` | Liste achievements   |

#### Adventures

| Méthode | Endpoint                   | Description            |
| ------- | -------------------------- | ---------------------- |
| GET     | `/adventures`              | Liste aventures user   |
| POST    | `/adventures`              | Créer aventure         |
| GET     | `/adventures/:id`          | Détail aventure        |
| PATCH   | `/adventures/:id`          | Modifier (pause, etc.) |
| DELETE  | `/adventures/:id`          | Abandonner aventure    |
| GET     | `/adventures/:id/messages` | Historique messages    |

#### Game (WebSocket + REST fallback)

| Méthode | Endpoint                 | Description           |
| ------- | ------------------------ | --------------------- |
| POST    | `/adventures/:id/action` | Envoyer action joueur |
| GET     | `/adventures/:id/state`  | État actuel du jeu    |

#### Reference Data

| Méthode | Endpoint     | Description         |
| ------- | ------------ | ------------------- |
| GET     | `/classes`   | Liste classes       |
| GET     | `/races`     | Liste races         |
| GET     | `/templates` | Templates aventures |

### 5.2 Format de Réponse Standard

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

### 5.3 Authentification

- **Access Token:** Header `Authorization: Bearer <token>`
- **Expiration:** 15 minutes (access), 7 jours (refresh)
- **Stockage frontend:** Access token en mémoire, refresh token en httpOnly cookie

---

## 6. Composants Système

### 6.1 Frontend (`apps/web`)

```
apps/web/
├── src/
│   ├── routes/              # TanStack Router (file-based)
│   │   ├── __root.tsx       # Layout racine + providers
│   │   ├── _authenticated/  # Routes protégées (layout)
│   │   │   ├── hub/
│   │   │   ├── adventure/
│   │   │   └── settings/
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   ├── onboarding/
│   │   └── index.tsx        # Landing/redirect
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── game/            # Composants session jeu
│   │   ├── character/       # Création/affichage perso
│   │   └── layout/          # Header, Sidebar, etc.
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAdventure.ts
│   │   └── useGameSession.ts
│   ├── services/
│   │   ├── api.ts           # Client API (fetch wrapper)
│   │   ├── auth.service.ts
│   │   ├── adventure.service.ts
│   │   └── socket.service.ts
│   ├── stores/
│   │   └── auth.store.ts    # État auth (zustand ou context)
│   ├── lib/
│   │   └── utils.ts
│   └── main.tsx
├── public/
├── index.html
└── package.json
```

### 6.2 Backend (`apps/api`)

```
apps/api/
├── src/
│   ├── index.ts             # Entry point
│   ├── app.ts               # Express app setup
│   ├── config/
│   │   ├── env.ts           # Variables d'environnement
│   │   ├── database.ts      # Config Drizzle
│   │   └── auth.ts          # Config JWT/Passport
│   ├── db/
│   │   ├── schema/          # Schémas Drizzle
│   │   │   ├── users.ts
│   │   │   ├── adventures.ts
│   │   │   ├── characters.ts
│   │   │   └── index.ts
│   │   ├── migrations/      # Fichiers migration
│   │   ├── seeds/           # Données de dev/test
│   │   └── index.ts         # Export db client
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── strategies/
│   │   ├── users/
│   │   ├── adventures/
│   │   ├── game/
│   │   │   ├── game.controller.ts
│   │   │   ├── game.service.ts
│   │   │   ├── game.socket.ts  # Socket.io handlers
│   │   │   └── llm/
│   │   │       ├── llm.provider.ts      # Interface
│   │   │       ├── openai.provider.ts
│   │   │       ├── anthropic.provider.ts
│   │   │       └── index.ts             # Factory
│   │   └── meta-character/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── errors.ts
│   └── types/
│       └── express.d.ts     # Augmentation Express
├── drizzle.config.ts
└── package.json
```

### 6.3 Package Partagé (`packages/shared`)

```
packages/shared/
├── src/
│   ├── schemas/             # Schémas Zod (générés + manuels)
│   │   ├── user.schema.ts
│   │   ├── adventure.schema.ts
│   │   ├── game.schema.ts
│   │   └── index.ts
│   ├── types/               # Types TypeScript
│   │   ├── user.ts
│   │   ├── adventure.ts
│   │   ├── game.ts
│   │   ├── api.ts           # Types réponses API
│   │   └── index.ts
│   ├── constants/
│   │   ├── game.constants.ts
│   │   └── index.ts
│   └── index.ts             # Export principal
├── tsconfig.json
└── package.json
```

---

## 7. Intégration LLM

### 7.1 Architecture Provider

```typescript
// apps/api/src/modules/game/llm/llm.provider.ts
export interface LLMProvider {
  readonly name: string;

  generateResponse(params: { systemPrompt: string; messages: ChatMessage[]; temperature?: number; maxTokens?: number }): Promise<string>;

  streamResponse(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    onChunk: (chunk: string) => void;
  }): Promise<void>;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
```

### 7.2 Stratégie Multi-Provider

```typescript
// apps/api/src/modules/game/llm/index.ts
export class LLMService {
  private providers: Map<string, LLMProvider>;
  private primaryProvider: string;
  private fallbackOrder: string[];

  async generate(params: GenerateParams): Promise<string> {
    const provider = this.getProvider();
    try {
      return await provider.generateResponse(params);
    } catch (error) {
      return this.tryFallback(params, error);
    }
  }

  async stream(params: StreamParams): Promise<void> {
    const provider = this.getProvider();
    return provider.streamResponse(params);
  }
}
```

### 7.3 Prompt System MJ

Le MJ IA utilise un système de prompts structuré :

1. **System Prompt** : Définit la personnalité, les règles, le ton
2. **Context Window** : Historique récent + état du jeu compressé
3. **User Action** : Action du joueur (choix ou texte libre)

```typescript
interface GameContext {
  character: AdventureCharacterDTO;
  setting: AdventureSettings;
  recentHistory: GameMessageDTO[]; // Derniers N messages
  worldState: Record<string, unknown>; // État narratif compressé
}
```

---

## 8. Architecture Frontend

### 8.1 Routing (TanStack Router)

```typescript
// apps/web/src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';

interface RouterContext {
  queryClient: QueryClient;
  auth: AuthState;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}
```

```typescript
// apps/web/src/routes/_authenticated.tsx
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});
```

### 8.2 State Management

**Approche hybride :**

- **Server State** : TanStack Query (aventures, messages, données API)
- **Client State** : Zustand ou Context (auth, UI state)

```typescript
// apps/web/src/stores/auth.store.ts
import { create } from "zustand";

interface AuthStore {
  user: UserDTO | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserDTO, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
```

### 8.3 API Client

```typescript
// apps/web/src/services/api.ts
import { useAuthStore } from "@/stores/auth.store";

const API_BASE = import.meta.env.VITE_API_URL;

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) => fetchApi<T>(endpoint, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data: unknown) => fetchApi<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: "DELETE" }),
};
```

---

## 9. Architecture Backend

### 9.1 Configuration Drizzle

```typescript
// apps/api/drizzle.config.ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

```typescript
// apps/api/src/db/schema/users.ts
import { pgTable, uuid, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### 9.2 Module Pattern

```typescript
// apps/api/src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { userLoginSchema, userCreateSchema } from "@jdrai/shared";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = userCreateSchema.parse(req.body);
      const result = await this.authService.register(data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = userLoginSchema.parse(req.body);
      const result = await this.authService.login(data);

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: { user: result.user, accessToken: result.accessToken },
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### 9.3 Middleware d'Authentification

```typescript
// apps/api/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { UserDTO } from "@jdrai/shared";

declare global {
  namespace Express {
    interface User extends UserDTO {}
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};
```

---

## 10. Structure Projet Complète

```
jdrai/
├── apps/
│   ├── web/                    # React + Vite SPA
│   │   ├── src/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── api/                    # Express backend
│       ├── src/
│       ├── drizzle.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── shared/                 # Types & schémas partagés
│       ├── src/
│       ├── tsconfig.json
│       └── package.json
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── docker-compose.yml
├── docs/
│   ├── prd.md
│   └── architecture.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 11. Workflow de Développement

### 11.1 Prérequis

```bash
node >= 20.x
pnpm >= 9.x
docker >= 24.x
```

### 11.2 Installation

```bash
# Clone et installation
git clone <repo>
cd jdrai
pnpm install

# Configuration environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Démarrer la base de données
docker compose up -d postgres

# Migrations
pnpm db:migrate

# Seeds (données de dev)
pnpm db:seed
```

### 11.3 Commandes de Développement

```bash
# Démarrer tout (turbo)
pnpm dev

# Démarrer individuellement
pnpm dev --filter=web
pnpm dev --filter=api

# Build
pnpm build

# Tests
pnpm test
pnpm test:e2e

# Linting
pnpm lint
pnpm lint:fix

# Base de données
pnpm db:generate    # Générer migration depuis schema
pnpm db:migrate     # Appliquer migrations
pnpm db:push        # Push schema (dev only)
pnpm db:studio      # Drizzle Studio (GUI)
pnpm db:seed        # Seeder données

# Génération types partagés
pnpm shared:generate
```

### 11.4 Configuration Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

### 11.5 Variables d'Environnement

```bash
# .env.example

# Database
DATABASE_URL=postgresql://jdrai:jdrai@localhost:5432/jdrai

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# API
API_PORT=3000
API_URL=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:3000/v1

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_PRIMARY_PROVIDER=openai

# Environment
NODE_ENV=development
```

---

## 12. Docker

### 12.1 Docker Compose (Développement)

```yaml
# docker/docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: jdrai-db
    environment:
      POSTGRES_USER: jdrai
      POSTGRES_PASSWORD: jdrai
      POSTGRES_DB: jdrai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U jdrai"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: jdrai-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 13. Sécurité

### 13.1 Frontend

| Mesure         | Implémentation                                      |
| -------------- | --------------------------------------------------- |
| XSS Prevention | React échappe par défaut, CSP headers               |
| Token Storage  | Access token en mémoire, refresh en httpOnly cookie |
| HTTPS          | Obligatoire en production                           |

### 13.2 Backend

| Mesure           | Implémentation                     |
| ---------------- | ---------------------------------- |
| Input Validation | Zod sur tous les endpoints         |
| SQL Injection    | Drizzle ORM (requêtes paramétrées) |
| Rate Limiting    | express-rate-limit par IP/user     |
| CORS             | Whitelist origines autorisées      |
| Password Hashing | bcrypt (cost factor 12)            |
| JWT              | Rotation tokens, blacklist refresh |

### 13.3 Headers de Sécurité

```typescript
// Helmet.js config
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.API_URL],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
```

---

## 14. Tests

### 14.1 Stratégie

```
                    E2E (Playwright)
                   /                \
           Integration Tests (API)
          /                        \
    Unit Frontend (Vitest)    Unit Backend (Vitest)
```

### 14.2 Structure

```
apps/
├── web/
│   └── tests/
│       ├── unit/           # Composants, hooks
│       └── e2e/            # Parcours utilisateur
└── api/
    └── tests/
        ├── unit/           # Services, utils
        └── integration/    # Routes API
```

### 14.3 Exemple Test API

```typescript
// apps/api/tests/integration/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { db } from "../../src/db";

describe("POST /v1/auth/register", () => {
  it("should create a new user", async () => {
    const response = await request(app).post("/v1/auth/register").send({
      email: "test@example.com",
      username: "testuser",
      password: "SecurePass123!",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe("test@example.com");
  });

  it("should reject duplicate email", async () => {
    // First registration
    await request(app).post("/v1/auth/register").send({
      email: "duplicate@example.com",
      username: "user1",
      password: "SecurePass123!",
    });

    // Second registration with same email
    const response = await request(app).post("/v1/auth/register").send({
      email: "duplicate@example.com",
      username: "user2",
      password: "SecurePass123!",
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("EMAIL_EXISTS");
  });
});
```

---

## 15. Conventions de Code

### 15.1 Règles Critiques

| Règle              | Description                                           |
| ------------------ | ----------------------------------------------------- |
| **Type Sharing**   | Toujours définir les types API dans `packages/shared` |
| **API Calls**      | Utiliser le service layer, jamais fetch direct        |
| **Env Variables**  | Accès via config objects uniquement                   |
| **Error Handling** | Utiliser le middleware d'erreur standard              |
| **Validation**     | Zod obligatoire sur tous les inputs API               |

### 15.2 Naming Conventions

| Élément              | Convention           | Exemple                |
| -------------------- | -------------------- | ---------------------- |
| Composants React     | PascalCase           | `UserProfile.tsx`      |
| Hooks                | camelCase + use      | `useAuth.ts`           |
| Services             | camelCase + .service | `auth.service.ts`      |
| Routes API           | kebab-case           | `/meta-character`      |
| Tables DB            | snake_case           | `adventure_characters` |
| Fichiers TS généraux | camelCase            | `gameUtils.ts`         |

---

## 16. Gestion des Erreurs

### 16.1 Format Erreur API

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
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "LLM_ERROR"
  | "LLM_TIMEOUT";
```

### 16.2 Error Middleware

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

---

## 17. Monitoring (Post-MVP)

### 17.1 Stack Recommandée

| Outil                    | Usage                         |
| ------------------------ | ----------------------------- |
| **Sentry**               | Error tracking (front + back) |
| **Prometheus + Grafana** | Métriques, dashboards         |
| **Winston**              | Logging structuré             |

### 17.2 Métriques Clés

**Backend:**

- Request rate / latency
- Error rate par endpoint
- LLM response time / token usage
- Database query performance

**Frontend:**

- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors
- API response times

---

## 18. Checklist de Validation

- [ ] Structure monorepo correcte (turbo + pnpm)
- [ ] Types partagés dans `packages/shared`
- [ ] Drizzle configuré avec migrations
- [ ] Auth JWT fonctionnelle
- [ ] Routes protégées (front + back)
- [ ] Validation Zod sur tous les endpoints
- [ ] Error handling unifié
- [ ] Variables d'environnement documentées
- [ ] Docker compose fonctionnel
- [ ] Tests de base en place
- [ ] CI/CD configuré

---

**Document généré via BMAD Method — Phase Architecture**
