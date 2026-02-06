# JDRAI - Document d'Architecture Fullstack

**Version:** 1.0
**Date:** 2026-02-05
**Statut:** En cours de mise à jour post-audit
**Auteur:** Architect (BMAD Method)

---

## 1. Introduction

Ce document définit l'architecture complète de JDRAI, une plateforme de jeu de rôle avec MJ IA. Il sert de source de vérité pour le développement, couvrant le backend, le frontend et leur intégration.

### 1.1 Projet Greenfield

N/A - Projet greenfield, aucun starter template utilisé.

### 1.2 Change Log

| Date       | Version | Description                                 | Auteur    |
| :--------- | :------ | :------------------------------------------ | :-------- |
| 2026-02-05 | 1.0     | Version initiale                            | Architect |
| 2026-02-05 | 1.1     | Auth: Better Auth + abstraction AuthService | Architect |

---

## 2. Architecture Haut Niveau

### 2.1 Résumé Technique

JDRAI adopte une **architecture monorepo fullstack** avec séparation claire entre l'API Express et le frontend React SPA. Le backend gère l'authentification via Better Auth (avec abstraction AuthService pour limiter le lock-in), la persistance PostgreSQL via Drizzle ORM, et l'intégration multi-provider LLM pour le MJ IA. Le frontend utilise TanStack Router pour le routing type-safe et TanStack Query pour la gestion du cache serveur. Les types sont partagés via un package interne, garantissant la cohérence des contrats API sans coupler le frontend à l'ORM.

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

| Catégorie              | Technologie       | Version | Rôle                 | Justification                              |
| :--------------------- | :---------------- | :------ | :------------------- | :----------------------------------------- |
| **Monorepo**           | Turborepo         | ^2.x    | Orchestration builds | Cache, parallélisation, DX                 |
| **Package Manager**    | pnpm              | ^9.x    | Gestion dépendances  | Workspaces natifs, performance             |
| **Langage**            | TypeScript        | ^5.x    | Typage               | Sécurité, DX, partage de types             |
| **Frontend Framework** | React             | ^18.x   | UI                   | Écosystème, TanStack compat                |
| **Build Tool**         | Vite              | ^5.x    | Bundling frontend    | HMR rapide, ESM natif                      |
| **Routing**            | TanStack Router   | ^1.x    | Navigation type-safe | Type inference, file-based                 |
| **Data Fetching**      | TanStack Query    | ^5.x    | Cache serveur        | Stale-while-revalidate, mutations          |
| **UI Components**      | shadcn/ui         | latest  | Design system        | Accessible, customizable, Tailwind         |
| **Styling**            | Tailwind CSS      | ^3.x    | Utilitaires CSS      | Productivité, bundle optimisé              |
| **Formulaires**        | React Hook Form   | ^7.x    | Gestion forms        | Performance, validation                    |
| **Validation**         | Zod               | ^3.x    | Schémas runtime      | Inférence TS, partage front/back           |
| **Backend Framework**  | Express           | ^4.x    | API HTTP             | Maturité, middleware ecosystem             |
| **ORM**                | Drizzle           | ^0.30+  | Accès BDD            | Type-safe, SQL-like, léger                 |
| **Schema Gen**         | drizzle-zod       | ^0.5+   | Génération Zod       | Sync schémas DB/validation                 |
| **Base de données**    | PostgreSQL        | 16.x    | Persistance          | ACID, JSONB, performances                  |
| **Auth**               | Better Auth       | ^1.x    | Authentification     | Drizzle natif, TypeScript-first, YC backed |
| **Temps réel**         | Socket.io         | ^4.x    | WebSocket            | Rooms, reconnexion auto                    |
| **Tests Unit**         | Vitest            | ^1.x    | Tests rapides        | Vite compat, ESM natif                     |
| **Tests E2E**          | Playwright        | ^1.x    | Tests navigateur     | Multi-browser, fiable                      |
| **Linting**            | ESLint + Prettier | latest  | Qualité code         | Standards, formatting                      |

---

## 4. Modèles de Données

> **Note MVP** : Les modèles ci-dessous représentent la structure initiale. Certains champs (notamment `CharacterStats`, système de règles, races/classes) seront affinés lors de la phase de game design. Le schéma Drizzle permettra des migrations incrémentales.

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

#### Auth (Better Auth - `/api/auth/*`)

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

| Méthode | Endpoint                   | Description                         |
| ------- | -------------------------- | ----------------------------------- |
| GET     | `/adventures`              | Liste aventures user                |
| POST    | `/adventures`              | Créer aventure                      |
| GET     | `/adventures/:id`          | Détail aventure                     |
| PATCH   | `/adventures/:id`          | Modifier (pause, abandon, settings) |
| GET     | `/adventures/:id/messages` | Historique messages                 |

> **Note** : L'abandon d'une aventure se fait via `PATCH` avec `{ status: "abandoned" }`, pas via `DELETE`. Une suppression physique n'est pas prévue pour conserver l'historique.

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

### 5.3 Authentification (Better Auth)

- **Méthode:** Sessions gérées par Better Auth via cookies httpOnly
- **Durée session:** 7 jours (configurable), refresh automatique après 1 jour d'activité
- **Transport:** Cookies httpOnly (pas de tokens exposés au JavaScript)
- **CSRF:** Protection automatique par Better Auth
- **Credentials:** Toutes les requêtes API doivent inclure `credentials: "include"`

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
│   │   └── index.tsx        # Redirect → /hub (auth) ou /auth/login
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
│   │   ├── adventure.service.ts
│   │   └── socket.service.ts
│   ├── stores/
│   │   └── ui.store.ts      # État UI (zustand)
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
│   │   └── database.ts      # Config Drizzle
│   ├── lib/
│   │   └── auth.ts          # Config Better Auth
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
│   │   │   ├── auth.interface.ts  # Abstraction IAuthService
│   │   │   └── auth.service.ts    # Implémentation Better Auth
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

### 8.2 Client Auth (Better Auth)

```typescript
// apps/web/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
});

// Hooks exportés
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

```typescript
// apps/web/src/hooks/useAuth.ts
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

export function useAuth() {
  const { data: session, isPending, error } = useSession();
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    const result = await signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  };

  const register = async (email: string, password: string, username: string) => {
    const result = await signUp.email({
      email,
      password,
      name: username,
      username,
    });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  };

  const logout = async () => {
    await signOut();
    navigate({ to: "/auth/login" });
  };

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    error,
    login,
    register,
    logout,
  };
}
```

### 8.3 State Management

**Approche hybride :**

- **Server State** : TanStack Query (aventures, messages, données API)
- **Auth State** : Better Auth (sessions gérées via cookies httpOnly)
- **UI State** : Zustand (préférences locales, UI transient)

```typescript
// apps/web/src/stores/ui.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  toggleSidebar: () => void;
  setTheme: (theme: UIStore["theme"]) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "system",
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "jdrai-ui" },
  ),
);
```

### 8.4 API Client

```typescript
// apps/web/src/services/api.ts
const API_BASE = import.meta.env.VITE_API_URL;

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include", // Important: envoie les cookies de session
    headers: {
      "Content-Type": "application/json",
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

### 8.5 Intégration TanStack Query + Auth

```typescript
// apps/web/src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface RouterContext {
  queryClient: QueryClient;
  auth: ReturnType<typeof useAuth>;
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
// apps/web/src/main.tsx
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!, // Sera injecté par AuthProvider
  },
});

function App() {
  const auth = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ queryClient, auth }} />
    </QueryClientProvider>
  );
}
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

// Note: Better Auth crée automatiquement les tables `user`, `session`, et `account`
// via son adapter Drizzle. Nous ajoutons uniquement les champs métier supplémentaires.
// Voir: https://www.better-auth.com/docs/concepts/database#core-schema

export const users = pgTable("user", {
  // Champs gérés par Better Auth: id, email, emailVerified, name, image, createdAt, updatedAt
  // Champs additionnels pour JDRAI:
  id: text("id").primaryKey(), // Better Auth utilise text, pas uuid
  username: text("username").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
});
```

### 9.2 Architecture Auth (Better Auth + Abstraction)

#### 9.2.1 Abstraction AuthService

L'abstraction permet de découpler la logique métier de l'implémentation Better Auth, facilitant une migration future si nécessaire.

```typescript
// apps/api/src/modules/auth/auth.interface.ts
import { UserDTO, UserCreateInput, UserLoginInput } from "@jdrai/shared";

export interface AuthResult {
  user: UserDTO;
  session: {
    id: string;
    expiresAt: Date;
  };
}

export interface IAuthService {
  register(data: UserCreateInput): Promise<AuthResult>;
  login(data: UserLoginInput): Promise<AuthResult>;
  logout(sessionId: string): Promise<void>;
  validateSession(sessionToken: string): Promise<{ user: UserDTO; session: Session } | null>;
  refreshSession(sessionToken: string): Promise<AuthResult | null>;
  getUser(userId: string): Promise<UserDTO | null>;
  updateUser(userId: string, data: Partial<UserDTO>): Promise<UserDTO>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}
```

#### 9.2.2 Configuration Better Auth

```typescript
// apps/api/src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // MVP: désactivé, activer en P2
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // Refresh si > 1 jour
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
      },
      role: {
        type: "string",
        defaultValue: "user",
      },
      onboardingCompleted: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },
  trustedOrigins: [process.env.FRONTEND_URL!],
});

// Export du type pour le client
export type Auth = typeof auth;
```

#### 9.2.3 Implémentation AuthService

```typescript
// apps/api/src/modules/auth/auth.service.ts
import { auth } from "../../lib/auth";
import { IAuthService, AuthResult } from "./auth.interface";
import { UserDTO, UserCreateInput, UserLoginInput } from "@jdrai/shared";

export class BetterAuthService implements IAuthService {
  async register(data: UserCreateInput): Promise<AuthResult> {
    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.username,
        username: data.username,
      },
    });

    if (!result.user) {
      throw new Error("Registration failed");
    }

    return {
      user: this.mapToUserDTO(result.user),
      session: {
        id: result.session.id,
        expiresAt: new Date(result.session.expiresAt),
      },
    };
  }

  async login(data: UserLoginInput): Promise<AuthResult> {
    const result = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
    });

    if (!result.user) {
      throw new Error("Invalid credentials");
    }

    return {
      user: this.mapToUserDTO(result.user),
      session: {
        id: result.session.id,
        expiresAt: new Date(result.session.expiresAt),
      },
    };
  }

  async logout(sessionId: string): Promise<void> {
    await auth.api.signOut({
      headers: { "x-session-id": sessionId },
    });
  }

  async validateSession(sessionToken: string) {
    const session = await auth.api.getSession({
      headers: { cookie: `better-auth.session_token=${sessionToken}` },
    });

    if (!session?.user) return null;

    return {
      user: this.mapToUserDTO(session.user),
      session: session.session,
    };
  }

  private mapToUserDTO(user: any): UserDTO {
    return {
      id: user.id,
      email: user.email,
      username: user.username || user.name,
      role: user.role || "user",
      onboardingCompleted: user.onboardingCompleted || false,
      createdAt: user.createdAt,
    };
  }

  // ... autres méthodes
}

// Export singleton
export const authService: IAuthService = new BetterAuthService();
```

### 9.3 Intégration Express

```typescript
// apps/api/src/index.ts
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/auth.middleware";

const app = express();

// Better Auth handler - DOIT être avant express.json()
app.all("/api/auth/*", toNodeHandler(auth));

// Middleware JSON pour les autres routes
app.use(express.json());

// Routes protégées
app.use("/api/v1/adventures", requireAuth, adventuresRouter);
app.use("/api/v1/meta-character", requireAuth, metaCharacterRouter);

app.listen(3000);
```

### 9.4 Middleware d'Authentification

```typescript
// apps/api/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { UserDTO } from "@jdrai/shared";

declare global {
  namespace Express {
    interface Request {
      user?: UserDTO;
      session?: { id: string; expiresAt: Date };
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username || session.user.name,
      role: session.user.role || "user",
      onboardingCompleted: session.user.onboardingCompleted || false,
      createdAt: session.user.createdAt,
    };
    req.session = session.session;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid session" },
    });
  }
};

// Middleware optionnel (session présente mais pas obligatoire)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session?.user) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username || session.user.name,
        role: session.user.role || "user",
        onboardingCompleted: session.user.onboardingCompleted || false,
        createdAt: session.user.createdAt,
      };
      req.session = session.session;
    }
  } catch {
    // Session invalide, on continue sans user
  }

  next();
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
│   ├── architecture.md
│   └── future documentations...
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

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars-change-in-production
BETTER_AUTH_URL=http://localhost:3000

# API
API_PORT=3000
API_URL=http://localhost:3000

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000

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

| Mesure          | Implémentation                                            |
| --------------- | --------------------------------------------------------- |
| XSS Prevention  | React échappe par défaut, CSP headers                     |
| Session Storage | Cookies httpOnly gérés par Better Auth (pas de JS access) |
| HTTPS           | Obligatoire en production                                 |
| CSRF            | Better Auth gère la protection CSRF automatiquement       |

### 13.2 Backend

| Mesure           | Implémentation                           |
| ---------------- | ---------------------------------------- |
| Input Validation | Zod sur tous les endpoints               |
| SQL Injection    | Drizzle ORM (requêtes paramétrées)       |
| Rate Limiting    | express-rate-limit par IP/user           |
| CORS             | Whitelist origines autorisées            |
| Password Hashing | Better Auth (Argon2 par défaut)          |
| Sessions         | Better Auth (cookies httpOnly, rotation) |

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

describe("POST /api/auth/sign-up/email", () => {
  it("should create a new user", async () => {
    const response = await request(app).post("/api/auth/sign-up/email").send({
      email: "test@example.com",
      name: "testuser",
      username: "testuser",
      password: "SecurePass123!",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("test@example.com");
    // Vérifie que le cookie de session est défini
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("should reject duplicate email", async () => {
    // First registration
    await request(app).post("/api/auth/sign-up/email").send({
      email: "duplicate@example.com",
      name: "user1",
      username: "user1",
      password: "SecurePass123!",
    });

    // Second registration with same email
    const response = await request(app).post("/api/auth/sign-up/email").send({
      email: "duplicate@example.com",
      name: "user2",
      username: "user2",
      password: "SecurePass123!",
    });

    expect(response.status).toBe(422); // Better Auth retourne 422 pour les conflits
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
- [ ] Auth Better Auth fonctionnelle
- [ ] Routes protégées (front + back)
- [ ] Validation Zod sur tous les endpoints
- [ ] Error handling unifié
- [ ] Variables d'environnement documentées
- [ ] Docker compose fonctionnel
- [ ] Tests de base en place
- [ ] CI/CD configuré

---

**Document généré via BMAD Method — Phase Architecture**

---

## 19. Actions post-audit de cohérence (PM + UX → Architecte)

> **Contexte** : Suite à l'audit de cohérence entre PRD v1.2, architecture v1.1 et UX cartography v1.0, les éléments ci-dessous doivent être intégrés dans ce document. Chaque action est classée par priorité (P1 = MVP, P2, P3) et référence sa source.
>
> **Sources** : `docs/prd.md` v1.2 | `docs/ux-cartography.md` v1.0

### 19.1 Actions P1 (MVP — impactent le développement immédiat)

#### A1. Routes onboarding détaillées

**Source** : PRD §4.2 F4, UX §3.1

L'arbre des routes frontend (§6.1) doit refléter les 3 sous-routes d'onboarding :

```
├── onboarding/
│   ├── welcome.tsx          # Bienvenue + explication
│   ├── profile-setup.tsx    # Choix pseudo + bases profil
│   └── tutorial.tsx         # Aventure tutoriel (= session guidée)
```

#### A2. Route `/adventure/:id/summary`

**Source** : UX §3.1

Ajouter la route de l'écran de fin d'aventure dans les routes frontend :

```
├── _authenticated/
│   └── adventure/
│       ├── $id.tsx           # Session de jeu
│       └── $id.summary.tsx   # Écran de fin (résumé + récompenses)
```

#### A3. Navigation en session de jeu (menu intégré + confirmation de sortie)

**Source** : PRD §4.2 F2, UX §3.2

En session de jeu, la sidebar/navigation classique est **masquée** (pas minimisée). À la place :

- Un **bouton de menu intégré à l'interface de jeu** (style jeu vidéo, pas burger menu classique d'application) donne accès aux actions : quitter, sauvegarder, paramètres MJ
- Ce bouton doit visuellement s'intégrer à l'UI de jeu (cohérent avec le design fantasy)
- **Confirmation obligatoire** avant toute sortie de session : changement de page (navigation), déconnexion, fermeture d'onglet (`beforeunload`). Modale de confirmation type "Êtes-vous sûr de vouloir quitter l'aventure ?"
- L'auto-save protège la progression, mais la confirmation évite les sorties involontaires

#### A4. Bottom Tab Bar mobile (navigation mobile-first)

**Source** : PRD §4.1, UX §3.2, §7.5

Ajouter un composant `BottomTabBar` dans `components/layout/` pour la navigation mobile (Hub, Profil, Aventure). La conception est mobile-first. Documenter les breakpoints (UX §7.5) :

- Mobile (< 768px) : bottom tab bar
- Tablette (768-1024px) : sidebar collapsée
- Desktop (> 1024px) : sidebar étendue

#### A5. Résilience frontend — Gestion 429 et reconnexion

**Source** : PRD §4.2 F2, UX §6.2

Le client API (§8.4 `services/api.ts`) doit gérer :

- **Rate limiting (HTTP 429)** : Intercepteur qui désactive la saisie, affiche un message, réactive après le délai du header `Retry-After`
- **Perte de connexion en session** : Message non-bloquant, auto-reconnexion (Socket.io gère déjà la reconnexion, mais l'UX côté composant doit l'afficher), reprise depuis dernier auto-save

### 19.2 Actions P2 (Post-MVP)

#### A6. Route `/profile`

**Source** : PRD §4.3 F5, UX §3.1

Ajouter la route dans les routes authentifiées :

```
├── _authenticated/
│   ├── hub/
│   ├── profile.tsx          # Détail méta-personnage (Identité, Progression, Cosmétiques)
│   ├── adventure/
│   └── settings/
```

#### A7. Structure `components/` étendue

**Source** : UX §5.1-5.7

La structure `components/` actuelle (§6.1) est trop sommaire. L'enrichir pour refléter l'inventaire de composants UX :

```
├── components/
│   ├── ui/              # shadcn (existant)
│   ├── layout/          # Header, Sidebar, BottomTabBar (enrichir)
│   ├── auth/            # AuthCard, inputs spécialisés
│   ├── onboarding/      # StepIndicator, WelcomeHero, PresetSelector, NarrativeBox
│   ├── hub/             # MetaCharacterBanner, AdventureCard, ActionCard, AdventureGrid, EmptyState
│   ├── game/            # NarrationPanel, ChoiceList, FreeInput, CharacterPanel, StreamingText (existant, enrichir)
│   ├── adventure/       # ParamSelector, ThemeCard, DifficultySlider, TemplateCard
│   ├── character/       # Création/affichage (existant)
│   ├── summary/         # SummaryCard, RewardList, XPGainAnimation
│   └── companion/       # CompanionMessage (P3, structure anticipée)
```

> **Note** : Le dossier `companion/` est créé en avance (vide ou avec un placeholder) pour que les emplacements d'intervention (loading, erreurs, empty states) puissent être facilement swappés en P3.

#### A8. Paramètres MJ en session — Panneau latéral

**Source** : PRD §4.3 F6, UX §4.2 note E15

Documenter le composant drawer/panneau latéral accessible depuis la session de jeu pour modifier les paramètres MJ. Deux catégories :

- Ajustements légers (modifiables) : ton, niveau de détail, longueur des réponses
- Paramètres structurels (verrouillés + tooltip explicatif) : difficulté, rigueur des règles

#### A9. Route `/settings` et contenu

**Source** : PRD §4.3 F8

Détailler le contenu de la route `/settings` :

- Compte : email, mot de passe, suppression
- Préférences : thème (light/dark/system), langue

#### A10. Résilience aventure — Endpoint "MJ bloqué"

**Source** : PRD §4.3 F9

Prévoir un endpoint API pour le reset de contexte narratif :

- `POST /adventures/:id/reset-context` — Relance le contexte LLM avec une narration de secours
- Bouton côté frontend : "Le MJ semble perdu" visible après N secondes sans réponse ou détection de boucle

### 19.3 Actions P3 (anticipation documentaire)

#### A11. Compagnon d'interface — Structure technique

**Source** : PRD §4.4 F10, UX §5.1, §7.2

Anticiper dans la documentation :

- Composant `CompanionMessage` dans `components/companion/`
- Store Zustand ou contexte pour les préférences compagnon (on/off)
- Les points d'intervention sont les mêmes que les états loading/erreur/empty du MVP → swap de composant en P3
- Le compagnon n'intervient JAMAIS en session de jeu (le MJ IA est le seul narrateur)

#### A12. Routes multijoueur

**Source** : UX §3.1, §2.5

Routes à anticiper (commentaires dans l'arbre des routes) :

```
├── _authenticated/
│   └── adventure/
│       └── $id.lobby.tsx    # Salle d'attente multi (P3)
├── join/
│   ├── $inviteCode.tsx      # Rejoindre via code (P3)
│   └── lobby.tsx            # Lobby public (P3, si validé — cf. UX §2.5.4 Q1)
```

#### A13. Détection double onglet

**Source** : PRD §4.4 F11, UX §6.2

Mécanisme technique à documenter : BroadcastChannel API ou événements localStorage pour détecter l'ouverture d'une même aventure dans plusieurs onglets.

---

### 19.4 Checklist de validation (mise à jour)

Compléter la checklist §18 avec :

- [ ] Routes onboarding détaillées (welcome, profile-setup, tutorial)
- [ ] Route `/adventure/:id/summary`
- [ ] Sidebar mode minimisé en session de jeu
- [ ] Bottom tab bar mobile (`components/layout/`)
- [ ] Intercepteur 429 dans le client API
- [ ] Reconnexion UX en session (composant)
- [ ] Structure `components/` alignée avec inventaire UX
