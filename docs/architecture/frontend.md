# Architecture Frontend

---

## Structure (`apps/web`)

```
apps/web/
├── src/
│   ├── routes/                  # TanStack Router (file-based)
│   │   ├── __root.tsx           # Layout racine + providers
│   │   ├── routing.utils.ts     # Décisions routing cross-routes (guards auth, cible onboarding)
│   │   ├── _authenticated/      # Routes protégées (layout)
│   │   │   ├── hub/
│   │   │   │   └── index.tsx    # Dashboard principal
│   │   │   ├── profile.tsx      # Détail méta-personnage (P2 — Identité, Progression, Cosmétiques)
│   │   │   ├── adventure/
│   │   │   │   ├── new.tsx          # Création aventure
│   │   │   │   ├── $id.tsx          # Session de jeu
│   │   │   │   └── $id.summary.tsx  # Écran de fin (résumé + récompenses)
│   │   │   │   # $id.lobby.tsx      # Salle d'attente multi (P3)
│   │   │   ├── onboarding/
│   │   │   │   ├── welcome.tsx              # Bienvenue + explication
│   │   │   │   ├── profile-setup.tsx        # Choix pseudo + bases profil
│   │   │   │   ├── tutorial.tsx             # Aventure tutoriel (session guidée)
│   │   │   │   └── onboarding.utils.ts      # Logique feature locale (localStorage welcome-seen)
│   │   │   # join/
│   │   │   #   └── lobby.tsx            # Lobby public — parcourir les parties (P3, auth requise)
│   │   │   └── settings/
│   │   │       └── index.tsx    # Paramètres (P2 simple, P3 complet)
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   └── reset-password.$token.tsx  # Réinitialisation mot de passe (E4)
│   │   # join/
│   │   #   └── $inviteCode.tsx          # Page d'invitation (P3 — route publique, contexte avant auth)
│   │   └── index.tsx            # Redirect → /hub (auth) ou /auth/login
│   ├── components/
│   │   ├── ui/                  # shadcn/ui generated primitives (vendor-like)
│   │   ├── layout/              # Header, Sidebar, BottomTabBar
│   │   ├── auth/                # AuthCard, inputs spécialisés
│   │   ├── onboarding/          # StepIndicator, WelcomeHero, PresetSelector, NarrativeBox
│   │   ├── hub/                 # MetaCharacterBanner, AdventureCard, ActionCard, AdventureGrid, EmptyState
│   │   ├── game/                # NarrationPanel, ChoiceList, FreeInput, CharacterPanel, StreamingText, HistoryDrawer, MilestoneHeader
│   │   ├── adventure/           # ParamSelector, ThemeCard, DifficultySlider, TemplateCard
│   │   ├── character/           # Création/affichage perso
│   │   ├── summary/             # SummaryCard, RewardList, XPGainAnimation
│   │   └── companion/           # CompanionMessage (P3, structure anticipée — placeholder vide)
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAdventure.ts
│   │   └── useGameSession.ts
│   ├── services/
│   │   ├── api.ts               # Client API (fetch wrapper + intercepteur 429)
│   │   ├── adventure.service.ts
│   │   └── socket.service.ts
│   ├── schemas/
│   │   └── auth.ts              # Zod schemas: forms + route search params (auth)
│   ├── stores/
│   │   └── ui.store.ts          # État UI (zustand)
│   ├── lib/
│   │   ├── auth-client.ts       # Better Auth client (infrastructure)
│   │   ├── redirects.ts         # Sanitisation des redirect URLs (sécurité)
│   │   ├── validation.ts        # Zod base config
│   │   └── utils.ts             # Utilitaires shadcn/ui (cn, etc.)
│   └── main.tsx
├── public/
├── index.html
└── package.json
```

> **Note `schemas/`** : Ce dossier contient les schémas Zod de validation (forms, route search params). Convention : un fichier par domaine (`auth.ts`, `adventure.ts`, etc.). Ne pas mettre les schémas dans `lib/` — `lib/` est réservé à la configuration d'infrastructure (auth-client, validation base, utils). Les schémas partagés entre plusieurs routes ou composants vont dans `schemas/` ; les schémas purement locaux à un composant unique peuvent rester co-localisés.

> **Note `lib/`** : Strictement réservé à l'infrastructure et aux utilitaires de sécurité génériques (`auth-client.ts`, `utils.ts`, `validation.ts`, `redirects.ts`). Ne pas y mettre de logique feature-spécifique ni de décisions de routing.

> **Convention co-location** : La logique utilitaire propre à une feature (ex : état localStorage) doit être co-localisée avec ses routes dans un fichier `*.utils.ts` (ex : `routes/_authenticated/onboarding/onboarding.utils.ts`). Ne pas introduire un dossier `features/` ou `modules/` — TanStack Router file-based routing fournit déjà le découpage vertical via l'arborescence `routes/`.
>
> **Exception : logique cross-routes** — Si une logique routing est consommée par plusieurs niveaux de routes (guards auth, décisions de redirection conditionnelles), elle va dans `routes/routing.utils.ts`. Règle de décision : si un `*.utils.ts` co-localisé devrait être importé par `lib/`, il appartient à `routes/routing.utils.ts` pour éviter la violation de layering (`lib/` ne doit jamais importer depuis `routes/`).

> **Note composants** : Le dossier `companion/` est créé vide en P1 pour que les points d'intervention (loading, erreurs, empty states) puissent être swappés facilement en P3. Les composants listés dans chaque dossier sont issus de l'inventaire UX Cartography §5.

---

## UI Primitives (shadcn/ui)

Le design system est basé sur **shadcn/ui** (Tailwind). Convention :

- **Configuration** : `apps/web/components.json`
- **Primitives générées** : `apps/web/src/components/ui/*`
- **Statut** : code généré, traité comme “vendor-like” (peu/pas modifié directement). En cas de custom, préférer des wrappers dans `components/` plutôt que de forker massivement `components/ui/`.
- **Linting** : `components/ui/**` peut être exclu d’ESLint pour éviter des noise diffs sur du code généré.

---

## Routing (TanStack Router)

### Bundler plugin (Vite)

Pour le file-based routing en Vite, utiliser le plugin **officiel** :

- `@tanstack/router-plugin` (dev dependency)
- `import { tanstackRouter } from "@tanstack/router-plugin/vite"`
- Le plugin doit être placé **avant** `@vitejs/plugin-react`

> Note: `@tanstack/router-vite-plugin` existe encore pour compatibilité, mais il est désormais un **proxy** qui ré-exporte le plugin depuis `@tanstack/router-plugin/vite` (migration “unplugin” côté TanStack).

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
    // Redirect vers onboarding si pseudo manquant (seul cas de redirect onboarding)
    if (!context.auth.user?.username) {
      throw redirect({ to: "/onboarding/profile-setup" });
    }
  },
  component: AuthenticatedLayout,
});
```

---

## Client Auth (Better Auth)

### Pattern retenu : proxy same-origin

Better Auth pose ses cookies httpOnly sur le domaine de la requête. Si le frontend (`:5173`) appelle le backend (`:3000`) directement, les cookies sont posés sur `:3000` et inaccessibles au frontend — la session ne persiste pas.

**Solution : toutes les requêtes `/api/*` transitent par un proxy qui les redirige vers le backend.** Le client Better Auth est configuré sans `baseURL` — il utilise `window.location.origin` par défaut, et c'est le proxy qui achemine vers le backend.

```
Frontend (localhost:5173) ──/api/auth/*──▶ Proxy ──▶ Backend (localhost:3000)
                                                       └─ Better Auth gère la DB
                                                       └─ Cookie posé sur :5173 ✓
```

> **En développement** : proxy Vite (`vite.config.ts`).
> **En production** : reverse proxy nginx/CDN — voir `infrastructure.md`.

### `auth-client.ts`

```typescript
// apps/web/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

// Pas de baseURL — utilise window.location.origin.
// Le proxy /api/* achemine vers le backend (voir vite.config.ts en dev,
// nginx/CDN en production).
export const authClient = createAuthClient({});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

### `useAuth.ts`

```typescript
// apps/web/src/hooks/useAuth.ts
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";
import { router } from "@/router";

export function useAuth() {
  const { data: session, isPending, error } = useSession();

  const login = async (email: string, password: string) => {
    const result = await signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  };

  const register = async (email: string, password: string) => {
    // name est requis par Better Auth — partie locale de l'email en placeholder.
    // Remplacé par le pseudo choisi en onboarding (Story 3.2 / setUsername).
    const result = await signUp.email({ email, password, name: email.split("@")[0] });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  };

  const logout = async () => {
    await signOut();
    router.navigate({ to: "/auth/login" });
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

### Responsabilités frontend vs backend

| Opération | Chemin | Responsable |
|---|---|---|
| Inscription, connexion, déconnexion | `/api/auth/*` | Better Auth (backend) via proxy |
| Réinitialisation mot de passe | `/api/auth/*` | Better Auth (backend) via proxy |
| Gestion session (`useSession`) | cookie httpOnly | Better Auth client (UI state only) |
| Mise à jour username/profil | `/api/v1/users/*` | Express + `BetterAuthService.setUsername()` |

> **Règle** : le frontend ne contient aucune logique métier liée à l'auth. Il envoie les données de formulaire aux endpoints Better Auth et gère l'état UI via `useSession()`.

---

## State Management

**Approche hybride :**

- **Server State** : TanStack Query (aventures, messages, données API)
- **Auth State** : Better Auth (sessions gérées via cookies httpOnly)
- **UI State** : Zustand (préférences locales, UI transient, préférences compagnon P3)

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

---

## API Client

```typescript
// apps/web/src/services/api.ts
// Recommended: same-origin `/api/*` via Vite proxy (dev) / reverse proxy (prod).
// Leave VITE_API_URL empty unless you intentionally switch to cross-origin.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = API_BASE ? `${API_BASE}${endpoint}` : endpoint;
  const response = await fetch(url, {
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

---

## Intégration TanStack Query + Auth

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

## Historique par milestones (HistoryDrawer)

> **Source** : PRD §4.2 F3, Wireframe E10 - Session de jeu §WF-E10-07

Le `HistoryDrawer` est un drawer latéral accessible en session de jeu, affichant l'historique des échanges **groupé par milestones** :

- **`MilestoneHeader`** : Séparateur visuel portant le nom du milestone (ex : « Réception de la quête »). Le milestone actif est visuellement distingué (badge, couleur)
- **Regroupement** : Les messages sont groupés sous le `MilestoneHeader` correspondant via `GameMessageDTO.milestone`
- **Aucune progression numérique** : Pas de « 2/4 » ni « 50% ». Seul le nom du milestone actuel est visible
- **Scroll** : L'historique scroll vers le milestone actif à l'ouverture du drawer
- **Data** : Utilise `GameStateDTO.milestones` pour les headers et `GameStateDTO.messages` pour le contenu, regroupés côté client

---

## Navigation en session de jeu

> **Source** : PRD §4.2 F2, UX §3.2

En session de jeu, la sidebar/navigation classique est **masquée** (pas minimisée). L'interface adopte un mode immersif :

- **Menu intégré** : Un bouton de menu stylé jeu vidéo (cohérent avec le design fantasy, pas un burger menu classique) donne accès aux actions :
  - Quitter l'aventure (avec confirmation)
  - Sauvegarder manuellement
  - Paramètres MJ (cf. [Paramètres MJ](#paramètres-mj-en-session-p2))
- **Confirmation de sortie obligatoire** : Toute tentative de quitter la session déclenche une modale de confirmation :
  - Changement de page (navigation interne)
  - Déconnexion
  - Fermeture d'onglet (`beforeunload`)
  - Message type : « Êtes-vous sûr de vouloir quitter l'aventure ? »
- **Auto-save** : La progression est sauvegardée automatiquement (la confirmation protège contre les sorties involontaires, pas contre la perte de données)

```typescript
// apps/web/src/hooks/useGameSession.ts (extrait)
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isInGameSession) {
      e.preventDefault();
      e.returnValue = "";
    }
  };
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [isInGameSession]);
```

---

## Navigation responsive — Breakpoints

> **Source** : PRD §4.1, UX §3.2, §7.5

La conception est **mobile-first**. Le composant `BottomTabBar` (`components/layout/BottomTabBar.tsx`) est le point d'entrée de navigation mobile.

| Breakpoint   | Taille     | Navigation        | Comportement                                                                                                                                                                                                                                                                                           |
| ------------ | ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mobile**   | < 768px    | Bottom Tab Bar    | Onglets : Hub, Profil, Aventure. Visible partout sauf en session de jeu et onboarding. L'onglet Aventure est **toujours visible** et ouvre toujours une **modale** : si aventure(s) en cours → modale de reprise (aventure la plus récente) ; si aucune aventure → modale d'invitation à en lancer une |
| **Tablette** | 768–1024px | Sidebar collapsée | Icônes uniquement, expand on hover                                                                                                                                                                                                                                                                     |
| **Desktop**  | > 1024px   | Sidebar étendue   | Navigation complète avec labels                                                                                                                                                                                                                                                                        |

> **Note** : En session de jeu, toute navigation (bottom bar, sidebar) est masquée au profit du menu intégré.

---

## Résilience client

> **Source** : PRD §4.2 F2, UX §6.2

Le client API intègre deux mécanismes de résilience P1 :

### Rate limiting (HTTP 429)

```typescript
// apps/web/src/services/api.ts (intercepteur 429)
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10);
    // Émet un événement pour désactiver la saisie côté UI
    rateLimitEmitter.emit("rate-limited", { retryAfter });
    throw new RateLimitError(retryAfter);
  }

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error);
  }

  return response.json();
}
```

**Comportement UX** : L'intercepteur désactive la saisie utilisateur, affiche un message explicatif (« Trop de requêtes, veuillez patienter… »), puis réactive automatiquement après le délai `Retry-After`.

### Messages d'erreur localisés

L'API retourne des erreurs avec un `code` machine (enum `ErrorCode`) et un `message` technique en anglais (pour les logs/debug). Le `message` de l'API n'est **jamais** affiché à l'utilisateur. Le frontend mappe le `code` vers un message localisé :

```typescript
// apps/web/src/lib/error-messages.ts
import type { ErrorCode } from "@jdrai/shared";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Données invalides.",
  UNAUTHORIZED: "Veuillez vous connecter.",
  FORBIDDEN: "Accès refusé.",
  NOT_FOUND: "Ressource introuvable.",
  CONFLICT: "Conflit avec une donnée existante.",
  MAX_ACTIVE_ADVENTURES: "Vous avez atteint la limite de 5 aventures actives.",
  RATE_LIMITED: "Trop de requêtes, veuillez patienter…",
  INTERNAL_ERROR: "Une erreur inattendue est survenue.",
  LLM_ERROR: "Le MJ rencontre des difficultés…",
  LLM_TIMEOUT: "Le MJ met trop de temps à répondre…",
};

export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INTERNAL_ERROR;
}
```

> **i18n (futur)** : En P1, un simple dictionnaire français suffit. Si le multi-langue est introduit, ce fichier migre vers une lib i18n (ex : `i18next`) avec un fichier de traductions par locale (`fr.json`, `en.json`). L'API ne change pas — le `code` reste la clé de mapping, seul le frontend évolue.

### Perte de connexion en session

- **Socket.io** gère la reconnexion automatique (natif)
- **UX** : Un message non-bloquant (toast/banner) informe l'utilisateur de la perte de connexion
- **Reprise** : Rechargement de l'état depuis le dernier auto-save côté serveur après reconnexion

```typescript
// apps/web/src/services/socket.service.ts (extrait)
socket.on("disconnect", (reason) => {
  connectionStatusEmitter.emit("disconnected", { reason });
});

socket.on("reconnect", () => {
  connectionStatusEmitter.emit("reconnected");
  // Recharge l'état de la session depuis le serveur
  socket.emit("game:resync", { adventureId });
});
```

---

## Paramètres MJ en session (P2)

> **Source** : PRD §4.3 F6, UX §4.2 note E15

Un **drawer/panneau latéral** accessible depuis le menu intégré permet de modifier les paramètres du MJ IA en cours de session. Deux catégories :

| Catégorie                  | Paramètres                                            | Modifiable en session ?                |
| -------------------------- | ----------------------------------------------------- | -------------------------------------- |
| **Ajustements légers**     | Ton narratif, niveau de détail, longueur des réponses | Oui                                    |
| **Paramètres structurels** | Difficulté, rigueur des règles                        | Non (verrouillés + tooltip explicatif) |

> Les paramètres structurels sont verrouillés car leur modification en cours de partie pourrait briser la cohérence narrative. Un tooltip explique pourquoi.

---

## Contenu de la page Settings (P2)

> **Source** : PRD §4.3 F8

La route `/settings` (P2 simple → P3 complet) contient :

| Section            | Contenu                                                  |
| ------------------ | -------------------------------------------------------- |
| **Compte**         | Email, changement de mot de passe, suppression de compte |
| **Préférences**    | Thème (light/dark/system), langue                        |
| **Compagnon** (P3) | Activer/désactiver, choix du compagnon (si applicable)   |

---

## Résilience aventure — « MJ bloqué » (P2)

> **Source** : PRD §4.3 F9

Mécanisme de secours quand le MJ IA ne répond plus ou boucle :

- **Endpoint** : `POST /adventures/:id/reset-context` — Relance le contexte LLM avec une narration de transition (« Le monde vacille un instant... »)
- **Déclencheur frontend** : Bouton « Le MJ semble perdu » visible après N secondes sans réponse ou détection de boucle narrative
- **Implémentation** : Le `GameService` reconstruit le contexte à partir du dernier état sauvegardé + résumé compressé de l'historique

---

## Anticipations techniques P3

> Ces éléments ne sont **pas développés en P1/P2** mais leur architecture est documentée pour faciliter l'intégration future.

### Compagnon d'interface (mascotte méta)

> **Source** : PRD §4.4 F10, UX §5.1, §7.2

- **Composant** : `CompanionMessage` dans `components/companion/` (dossier créé vide en P1)
- **Store** : Clé `companion` dans le store Zustand UI (`ui.store.ts`) pour les préférences on/off et personnalité
- **Points d'intervention** : Les mêmes que les états loading, erreur et empty state du MVP → swap de composant en P3
- **Règle absolue** : Le compagnon n'intervient **JAMAIS** en session de jeu. Le MJ IA est le seul narrateur en session

### Détection double onglet

> **Source** : PRD §4.4 F11, UX §6.2

Mécanisme pour détecter l'ouverture d'une même aventure dans plusieurs onglets :

- **Technologie** : `BroadcastChannel` API (fallback : événements `localStorage`)
- **Comportement** : L'onglet le plus récent affiche un message « Cette aventure est déjà ouverte dans un autre onglet » et bloque l'interaction
- **Scope** : Uniquement les routes `/adventure/:id` (session de jeu active)

### Routes multijoueur

> **Source** : UX §3.1, §2.5

Routes anticipées dans l'arbre (commentées) :

- `/adventure/:id/lobby` — Salle d'attente multi (sous `_authenticated/`)
- `/join/:inviteCode` — Page d'invitation (**route publique** — hors `_authenticated/`)
- `/join/lobby` — Lobby public, parcourir les parties (sous `_authenticated/` — cf. UX §2.5.4 Q1)

> **Pourquoi séparer `/join` en deux niveaux d'auth ?**
>
> - **`/join/:inviteCode` = publique** : Le parcours « Rejoindre un ami » (PRD F13, UX §2.2) commence par un lien reçu par un utilisateur potentiellement non inscrit. La page d'invitation affiche le contexte (qui invite, quelle partie) **avant** l'authentification. Pattern standard des invitations (Slack, Discord, Notion).
> - **`/join/lobby` = authentifiée** : Le lobby est accédé depuis le Hub (UX §3.3 « Parcourir le lobby »). Parcourir les parties disponibles n'a de sens que pour un utilisateur connecté.
