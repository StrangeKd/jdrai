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
│   ├── routes/
│   │   ├── api.router.ts     # Better Auth handler + montage /v1 (AUCUNE logique métier)
│   │   └── v1.router.ts      # Groupement de toutes les routes v1 (users, adventures, game…)
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

1. **System Prompt** : Persona "Le Chroniqueur" (cf. GDD §4) — ton adapté à la difficulté configurée, règles de narration (tutoiement, présent, jamais de 4e mur, jamais de mécaniques explicites), instructions fail state selon difficulté (cf. GDD §6)
2. **Milestone Context** : Liste des milestones avec statuts, milestone actif, objectif narratif en cours
3. **Context Window** : Historique récent + état du jeu compressé (`worldState`)
4. **D20 Injection** : Résultat du lancer D20 + DC calculé + consigne de narration (invisible joueur) — cf. §D20 ci-dessous
5. **User Action** : Action du joueur (choix ou texte libre)

### Injection D20 dans le Prompt MJ

> **Source** : GDD GD-001 et §3.4

À chaque action significative du joueur, le `GameService` calcule le contexte de résolution **avant** l'appel LLM et l'injecte dans le prompt :

```
[SYSTÈME — INVISIBLE AU JOUEUR]
Action du joueur : "Je tente de crocheter la serrure"
Lancer D20 : {roll}                     ← Généré par le serveur (Math.random)
DC contextuel : {baseDC} ({actionType}) + {difficultyModifier} ({difficulty}) = {finalDC}
Bonus personnage : {characterBonus} ({reason})
Résultat final : {roll + characterBonus} vs DC {finalDC} → {OUTCOME}
Consigne : {narrativeInstruction}        ← Ne jamais mentionner le dé, le DC ni le score
```

**Valeurs OUTCOME et narrativeInstruction :**

| Condition | OUTCOME | narrativeInstruction |
|---|---|---|
| roll = 20 | SUCCÈS CRITIQUE | Narrer une réussite exceptionnelle avec bonus narratif |
| roll + bonus ≥ finalDC | SUCCÈS NET | Narrer un succès clair et satisfaisant |
| roll + bonus entre finalDC-1 et finalDC-5 | SUCCÈS PARTIEL | Narrer un succès avec une complication narrative |
| roll + bonus < finalDC-5 | ÉCHEC NARRATIF | Narrer un échec qui ouvre une nouvelle voie (fail forward) |
| roll = 1 | ÉCHEC CRITIQUE | Narrer un échec avec conséquences notables |

**Modificateurs DC par difficulté (GDD §3.2) :**

| Difficulté | Code | Modificateur DC |
|---|---|---|
| Facile | `easy` | -3 |
| Normal | `normal` | 0 |
| Difficile | `hard` | +2 |
| Cauchemar | `nightmare` | +4 |

**Bonus personnage P1 (GDD §3.3) — implicites, déterminés par le GameService :**

| Situation | Bonus |
|---|---|
| Action liée à la classe du personnage | +2 |
| Action cohérente avec le contexte narratif | +1 |
| Répétition d'une action déjà échouée | -2 |

**DC de base par type d'action :**

| Type | DC | Exemples |
|---|---|---|
| Triviale | 5 | Ouvrir une porte non verrouillée |
| Facile | 8 | Escalader un mur bas |
| Moyenne | 12 | Crocheter une serrure |
| Difficile | 15 | Désamorcer un piège |
| Très difficile | 18 | Forcer une porte enchantée |

> **Règle P1** : Le roll D20 est exécuté côté serveur (`GameService`). Le résultat est stocké dans `Message.metadata` pour la feature "dés visibles" P2 (cf. data-models.md). Il n'est jamais exposé au frontend en P1.

### Signaux structurés dans la réponse LLM

Le MJ IA communique des événements structurés via des marqueurs dans sa réponse, parsés par le `GameService` après réception :

| Marqueur | Usage | Action GameService |
|---|---|---|
| `[MILESTONE_COMPLETE:nom]` | Milestone narratif atteint | Passe le milestone en `completed`, active le suivant en `active` |
| `[HP_CHANGE:-5]` | Dégâts subis par le personnage | Met à jour `AdventureCharacter.currentHp` (ne peut pas descendre sous 0) |
| `[HP_CHANGE:+3]` | Soin du personnage | Met à jour `AdventureCharacter.currentHp` (ne peut pas dépasser `maxHp`) |
| `[ADVENTURE_COMPLETE]` | Dernière scène narrée, aventure conclue | Déclenche la génération du résumé E11 et passe l'aventure en `completed` |
| `[GAME_OVER]` | Fin d'aventure par échec (Hard/Nightmare) | Idem `ADVENTURE_COMPLETE` — distingué uniquement par le ton narratif et le contexte |

> **Note** : Les marqueurs sont toujours sur une ligne séparée et supprimés du texte affiché au joueur. Le `GameService` parse avec une regex avant streaming/affichage.

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
  username: text("username"), // Nullable — défini en onboarding (E6)
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
  setUsername(userId: string, username: string): Promise<UserDTO>;
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
    requireEmailVerification: false, // Non-bloquant en P1 (le joueur accède directement à l'onboarding)
    sendResetPassword: async ({ user, url }) => {
      // P1 (internal dev/test only): log reset link to console
      // P2: replace with EmailService.sendPasswordReset() — see infrastructure.md §Email
      console.log(`[DEV] Password reset link for ${user.email}: ${url}`);
    },
  },
  emailVerification: {
    sendOnSignUp: true, // Sends a verification email on signup
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60, // 1h
    sendVerificationEmail: async ({ user, url }) => {
      // P1 (internal dev/test only): log verification link to console
      // P2: replace with EmailService.sendEmailVerification() — see infrastructure.md §Email
      console.log(`[DEV] Email verification link for ${user.email}: ${url}`);
    },
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
        required: false, // Défini en onboarding (E6), pas à l'inscription
      },
      role: {
        type: "string",
        defaultValue: "user", // Valeur unique en P1. Si besoin admin/modération futur → activer le plugin `admin` de Better Auth (RBAC natif, set-role, has-permission). Ne pas implémenter de logique de rôles custom.
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
  async register(data: { email: string; password: string }): Promise<AuthResult> {
    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        // Utilise la partie avant le @ de l'email comme nom temporaire avant E6-01
        name: data.email.split("@")[0],
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
      username: user.username || null,
      role: user.role || "user",
      onboardingCompleted: user.onboardingCompleted || false,
      createdAt: user.createdAt,
    };
  }

  async setUsername(userId: string, username: string): Promise<UserDTO> {
    // Met à jour username (champ JDRAI) ET name (champ Better Auth natif)
    const updated = await auth.api.updateUser({
      body: {
        name: username,
        username,
      },
      headers: { "x-user-id": userId },
    });

    if (!updated.user) {
      throw new Error("Failed to set username");
    }

    return this.mapToUserDTO(updated.user);
  }

  // ... autres méthodes
}

// Export singleton
export const authService: IAuthService = new BetterAuthService();
```

---

## Intégration Express

### Pattern de routing : Grouped + Versioned

Le routing suit un pattern en **deux niveaux** :

1. **`app.ts`** — Setup Express uniquement (sécurité, CORS, erreurs). Monte `apiRouter` sur `/api`.
2. **`routes/api.router.ts`** — Handler Better Auth + montage du routeur versionné. Aucune logique métier.
3. **`routes/v1.router.ts`** — Regroupe toutes les routes v1 par module. Un fichier de routes par domaine métier dans `modules/`.

Ce pattern permet :
- Un préfixe `/api` déclaré une seule fois dans `app.ts`
- Une migration future vers `/api/v2` sans toucher à `app.ts` ni à `api.router.ts`
- Une séparation claire des responsabilités à chaque niveau

```typescript
// apps/api/src/app.ts
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";
import { apiRouter } from "./routes/api.router";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// Préfixe /api appliqué une seule fois
app.use("/api", apiRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(errorHandler);
```

```typescript
// apps/api/src/routes/api.router.ts
import { toNodeHandler } from "better-auth/node";
import express, { Router } from "express";

import { auth } from "../lib/auth";
import { v1Router } from "./v1.router";

export const apiRouter = Router();

// ⚠️ CONTRAINTE CRITIQUE — NE PAS MODIFIER L'ORDRE
// Better Auth gère son propre body parsing via `toNodeHandler`.
// Si express.json() est placé avant ce handler, Better Auth ne peut plus
// lire le body des requêtes d'auth → toutes les routes /auth/* cassent silencieusement.
// Règle : apiRouter.all("/auth/*", ...) doit TOUJOURS précéder apiRouter.use(express.json()).
apiRouter.all("/auth/*", toNodeHandler(auth));

// JSON middleware pour toutes les routes versionnées
apiRouter.use(express.json());

// Routes versionnées — ajouter /v2 ici le moment venu sans toucher à app.ts
apiRouter.use("/v1", v1Router);
```

```typescript
// apps/api/src/routes/v1.router.ts
import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware";
import { usersRouter } from "../modules/users/users.router";
// import { adventuresRouter } from "../modules/adventures/adventures.router";
// import { gameRouter } from "../modules/game/game.router";

export const v1Router = Router();

v1Router.use("/users", requireAuth, usersRouter);
// v1Router.use("/adventures", requireAuth, adventuresRouter);
// v1Router.use("/game", requireAuth, gameRouter);
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
      username: session.user.username || null,
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
        username: session.user.username || null,
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
