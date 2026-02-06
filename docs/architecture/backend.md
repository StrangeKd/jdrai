# Architecture Backend

---

## Structure (`apps/api`)

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
│   │   │   ├── milestones.ts    # Jalons narratifs (P1)
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

---

## Intégration LLM

### Architecture Provider

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

### Stratégie Multi-Provider

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

### Prompt System MJ

Le MJ IA utilise un système de prompts structuré :

1. **System Prompt** : Définit la personnalité, les règles, le ton
2. **Milestone Context** : Liste des milestones avec statuts, milestone actif, objectif narratif en cours
3. **Context Window** : Historique récent + état du jeu compressé
4. **User Action** : Action du joueur (choix ou texte libre)

### Gestion des Milestones par le LLM

Le `GameService` orchestre le cycle de vie des milestones :

1. **Création d'aventure** : Le LLM génère la liste initiale de milestones (noms + descriptions) basée sur `estimatedDuration` (courte = 2-3, moyenne = 4-5, longue = 6+). Le premier milestone passe en `active`
2. **En cours de jeu** : Le system prompt inclut le milestone actif et ses objectifs narratifs. Le LLM signale les transitions via un marqueur structuré dans sa réponse (ex: `[MILESTONE_COMPLETE:nom]`)
3. **Transition** : Le `GameService` parse la réponse, met à jour le statut du milestone complété (`completed` + `completedAt`), active le suivant (`active` + `startedAt`), et tagge les nouveaux messages avec le `milestoneId` courant
4. **Fin d'aventure** : Le dernier milestone complété déclenche la génération du résumé et des récompenses

```typescript
interface GameContext {
  character: AdventureCharacterDTO;
  setting: AdventureSettings;
  milestones: MilestoneDTO[]; // Structure narrative complète
  currentMilestone: MilestoneDTO | null; // Milestone actif
  recentHistory: GameMessageDTO[]; // Derniers N messages
  worldState: Record<string, unknown>; // État narratif compressé
}
```

---

## Configuration Drizzle

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

---

## Architecture Auth (Better Auth + Abstraction)

### Abstraction AuthService

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

### Configuration Better Auth

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

### Implémentation AuthService

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

---

## Intégration Express

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

---

## Middleware d'Authentification

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
