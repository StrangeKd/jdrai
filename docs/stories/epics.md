# JDRAI — Epics P1

**Version :** 0.2 (SM — restructuration 8 epics)
**Date :** 2026-02-19
**Statut :** Structure validée — prête pour décomposition en stories
**Sources :** PRD v1.5, GDD v1.0, UX Cartography v1.0, Wireframes v0.3, Architecture v1.4

---

## Vue d'ensemble

Le P1 est découpé en **8 epics** ordonnées par dépendance technique et valeur produit. Chaque epic livre une **tranche verticale testable** (cf. PRD §8.0 — testabilité continue).

```
Epic 1 ─ Fondation technique
   └──► Epic 2 ─ Authentification
           └──► Epic 3 ─ Onboarding : Setup (E5+E6)
                   └──► Epic 4 ─ Navigation & Hub (E8)
                           └──► Epic 5 ─ Lancement d'aventure (E9)
                                   └──► Epic 6 ─ Session de jeu (E10)
                                           └──► Epic 7 ─ Fin d'aventure & Cycle de vie (E11)
                                                   └──► Epic 8 ─ Onboarding : Tutorial (E7)
```

---

## Epic 1 — Fondation technique

**Objectif :** Mettre en place l'infrastructure de développement permettant à toutes les epics suivantes de démarrer.

|                  |                                                                               |
| ---------------- | ----------------------------------------------------------------------------- |
| **Features PRD** | Aucune feature utilisateur — prérequis technique                              |
| **Écrans**       | Aucun                                                                         |
| **Dépendances**  | Aucune                                                                        |
| **Testabilité**  | `pnpm dev` lance le monorepo, la DB est accessible, le shared package compile |

**Scope :**

- Monorepo Turborepo + pnpm workspaces
- Structure `apps/web` (React + Vite), `apps/api` (Express + TypeScript), `packages/shared`
- PostgreSQL via Docker Compose
- Configuration TypeScript, ESLint, Prettier
- Scripts de dev (`dev`, `build`, `lint`, `test`)
- Drizzle ORM + drizzle-zod (config initiale, connexion DB)
- Fichier `.env.example` avec variables documentées
- Seed de base (tables de référence : races, classes avec défauts P1)
- **Seed aventures templates** : 2 scénarios Heroic Fantasy contrastés (cf. GDD GD-008) — structure DB seedée, contenu des prompts défini lors de l'écriture des stories
- CI basique (lint + typecheck + tests)

**Hors scope :**

- Aucune feature utilisateur
- Pas de déploiement production

### Stories

#### Story 1.1 : Initialisation du monorepo

**En tant que** développeur,
**je veux** un monorepo Turborepo avec la structure apps/web, apps/api, packages/shared,
**afin de** pouvoir démarrer le développement de toutes les epics avec `pnpm dev`.

**Critères d'acceptation :**

- [ ] Turborepo + pnpm workspaces initialisés (`turbo.json`, `pnpm-workspace.yaml`, `package.json` racine)
- [ ] `apps/web` : React + Vite scaffold, sert une page vide sur `localhost:5173`
- [ ] `apps/api` : Express + TypeScript scaffold, répond `GET /health` → 200
- [ ] `packages/shared` : compile et est importable depuis web et api (`@jdrai/shared`)
- [ ] TypeScript configuré (`strict: true`, `ES2022`, `noUncheckedIndexedAccess`, tsconfig base + extends par package)
- [ ] `pnpm dev` démarre simultanément web + api (Turborepo `persistent: true`)
- [ ] Alias `@/` configuré dans web et api (paths tsconfig + Vite resolve)

**Réf. architecture :** `README.md` §Structure Projet, `infrastructure.md` §Turborepo, `coding-standards.md` §TypeScript

---

#### Story 1.2 : Qualité de code & Outillage dev

**En tant que** développeur,
**je veux** une configuration ESLint + Prettier partagée et un `.env.example` documenté,
**afin de** garantir la cohérence du code et la reproductibilité de l'environnement dès le début.

**Critères d'acceptation :**

- [ ] ESLint configuré : config partagée racine + extensions par app, règles TypeScript strict (pas de `any`, pas de `as` cast)
- [ ] Prettier configuré à la racine (`semi: true`, `singleQuote: false`, `tabWidth: 2`, `trailingComma: "all"`, `printWidth: 100`)
- [ ] `.env.example` documenté avec toutes les variables (DATABASE_URL, BETTER_AUTH_SECRET, API_PORT, FRONTEND_URL, VITE_API_URL, LLM keys, NODE_ENV)
- [ ] `.gitignore` complet (node_modules, dist, .env, IDE, Docker volumes)
- [ ] Scripts fonctionnels : `pnpm lint`, `pnpm lint:fix`, `pnpm format:check`, `pnpm typecheck`
- [ ] `pnpm lint` et `pnpm typecheck` passent sans erreur sur le code existant
- [ ] Ordre des imports appliqué par ESLint (node → external → monorepo → local → relative)

**Réf. architecture :** `coding-standards.md` §ESLint & Prettier, §Imports, §Variables d'Environnement, `infrastructure.md` §Variables d'Environnement

---

#### Story 1.3 : Base de données & ORM

**En tant que** développeur,
**je veux** une base PostgreSQL Dockerisée avec Drizzle ORM configuré et les données de référence seedées,
**afin de** disposer de la couche de données fonctionnelle pour les epics suivantes.

**Critères d'acceptation :**

- [ ] Docker Compose avec PostgreSQL 16-alpine (`docker/docker-compose.yml`, healthcheck, volume persistant)
- [ ] `docker compose up -d postgres` démarre la DB accessible sur `localhost:5432`
- [ ] Drizzle ORM configuré dans `apps/api` (`drizzle.config.ts`, connexion via `DATABASE_URL`)
- [ ] drizzle-zod configuré pour la génération de schémas Zod depuis les tables Drizzle
- [ ] Config environnement typée et validée Zod au démarrage (`apps/api/src/config/env.ts`)
- [ ] Infrastructure migrations fonctionnelle : `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`
- [ ] Tables de référence créées : `races` (Humain par défaut), `classes` (Aventurier par défaut)
- [ ] Table `adventure_templates` créée (id, name, description, difficulty, estimated_duration, system_prompt, seed_data)
- [ ] Seed 2 templates Heroic Fantasy contrastés (structure en place, contenu des prompts à affiner ultérieurement)
- [ ] Script seed fonctionnel : `pnpm db:seed` peuple les tables de référence
- [ ] Schémas Zod partagés exportés dans `packages/shared` pour les types seedés (races, classes, templates)

**Réf. architecture :** `infrastructure.md` §Docker, §Commandes de Développement, `data-models.md` §Tables, `coding-standards.md` §Validation Zod, §Variables d'Environnement

---

#### Story 1.4 : Pipeline CI

**En tant que** développeur,
**je veux** un pipeline CI GitHub Actions exécutant lint, typecheck et tests sur chaque push/PR,
**afin de** garantir la non-régression du code à chaque contribution.

**Critères d'acceptation :**

- [ ] `.github/workflows/ci.yml` configuré
- [ ] Déclenché sur push `main` et PR vers `main`
- [ ] Steps : checkout → pnpm install → lint → typecheck → test
- [ ] Pipeline passe sur l'état actuel du code
- [ ] Échec de pipeline visible sur la PR (status check)

**Réf. architecture :** `infrastructure.md` §Commandes de Développement, `README.md` §Structure Projet (`.github/workflows/`)

---

## Epic 2 — Authentification

**Objectif :** Permettre à un utilisateur de s'inscrire, se connecter et gérer son mot de passe.

|                  |                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F1 — Authentification                                                                                                                                                                             |
| **Écrans**       | E1 Login, E2 Register, E3 Forgot Password, E4 Reset Password                                                                                                                                      |
| **Wireframes**   | `wireframes/E1-E2-auth.md`                                                                                                                                                                        |
| **Dépendances**  | Epic 1 (fondation)                                                                                                                                                                                |
| **Testabilité**  | Un utilisateur peut s'inscrire, se connecter, se déconnecter, réinitialiser son MDP. Email de vérification envoyé (non-bloquant). Redirection post-inscription vers Epic 3 (Onboarding : Setup). |

**Scope :**

- Better Auth + Drizzle adapter (cookies httpOnly, CSRF)
- Table `users` (schéma Drizzle + DTO partagé)
- Inscription (email + mot de passe, **sans username** — collecté à Epic 3)
- Connexion / Déconnexion
- Mot de passe oublié → email → reset
- Email verification : `sendOnSignUp: true`, non-bloquante (accès direct post-inscription)
- Pages auth plein écran (sidebar masquée, cf. UX Cartography §3.2)
- Placeholder OAuth (séparateur visuel "ou", boutons désactivés — PRD décision)
- Redirection post-inscription → Epic 3 (Onboarding : Setup, si nouveau joueur)
- Redirection post-login → Hub (si joueur existant avec username) ou Epic 3 (si username manquant)
- Guards/middleware auth côté API + côté frontend (routes protégées)

**Hors scope :**

- OAuth fonctionnel (placeholder visuel uniquement)
- Username (Epic 3 — Onboarding : Setup)

### Stories

#### Story 2.1 : Backend auth — Better Auth + table users

**En tant que** développeur,
**je veux** Better Auth configuré avec l'adapter Drizzle et la table `users` étendue,
**afin de** disposer de l'infrastructure d'authentification côté serveur.

**Critères d'acceptation :**

- [ ] Better Auth installé et configuré (`apps/api/src/lib/auth.ts`) avec Drizzle adapter
- [ ] Tables Better Auth auto-générées (`user`, `session`, `account`) + champs additionnels JDRAI (`username` nullable, `role` enum, `onboardingCompleted` boolean)
- [ ] `IAuthService` interface + `BetterAuthService` implémentation (register, login, logout, validateSession, setUsername, requestPasswordReset, resetPassword)
- [ ] `requireAuth` et `optionalAuth` middleware fonctionnels (`apps/api/src/middleware/auth.middleware.ts`)
- [ ] Préfixe `/api` monté une seule fois (`app.use("/api", apiRouter)`), et handler Better Auth monté dans le routeur : `apiRouter.all("/auth/*", toNodeHandler(auth))` — avant `apiRouter.use(express.json())`
- [ ] Email verification configuré : `sendOnSignUp: true`, non-bloquante (`requireEmailVerification: false`)
- [ ] Session : cookies httpOnly, 7 jours, refresh après 1 jour, CSRF actif
- [ ] `UserDTO` et `UserCreateInput` exportés dans `packages/shared`
- [ ] `trustedOrigins` configuré avec `FRONTEND_URL`
- [ ] Endpoint `GET /users/me` retourne le profil utilisateur authentifié

**Réf. architecture :** `backend.md` §Architecture Auth, §Middleware, `data-models.md` §Users, `api.md` §Auth

---

#### Story 2.2 : Pages auth — Login et Register (E1+E2)

**En tant que** joueur,
**je veux** pouvoir m'inscrire et me connecter via des pages auth immersives,
**afin d'** accéder à JDRAI avec mon compte.

**Critères d'acceptation :**

- [ ] E1 Login : AuthCard parchemin centrée sur fond dark fantasy, inputs email + password, toggle visibilité password, CTA "Connexion", lien "Mot de passe oublié ?" → E3, lien "S'inscrire" → E2
- [ ] E2 Register : AuthCard avec inputs email + password + confirm password, indicateur force MDP ("Min. 8 caractères"), CTA "S'inscrire", séparateur "ou" (placeholder OAuth vide P1), lien "Se connecter" → E1
- [ ] Auth client Better Auth configuré (`apps/web/src/lib/auth-client.ts`) avec `createAuthClient`
- [ ] Hook `useAuth` fonctionnel (login, register, logout, session, isAuthenticated)
- [ ] Validation côté client (Zod + React Hook Form) : email format, password min 8 chars, confirm match
- [ ] Erreurs inline sous les champs (WF-AUTH-01) + erreur globale login "Identifiants incorrects" (WF-AUTH-02) — message générique (sécurité)
- [ ] Spinner sur le CTA pendant la requête
- [ ] Post-register → redirect `/onboarding/welcome` (E5)
- [ ] Post-login → redirect `/hub` (ou `/onboarding/profile-setup` si username absent)
- [ ] Sidebar et tab bar masquées sur les pages auth
- [ ] Responsive : AuthCard centrée mobile + desktop (`max-width: ~420px`)

**Réf. wireframes :** `E1-E2-auth.md` §WF-E1-01, §WF-E2-01, §WF-AUTH-01, §WF-AUTH-02, §WF-AUTH-05
**Réf. architecture :** `frontend.md` §Client Auth, §Routing

---

#### Story 2.3 : Mot de passe oublié et reset (E3+E4)

**En tant que** joueur,
**je veux** pouvoir réinitialiser mon mot de passe via email,
**afin de** récupérer l'accès à mon compte si j'oublie mon mot de passe.

**Critères d'acceptation :**

- [ ] E3 Forgot Password : input email, CTA "Envoyer le lien", lien retour → E1
- [ ] E3 Confirmation (WF-E3-02) : message ambigu "Si un compte existe..." (sécurité — pas d'énumération)
- [ ] E4 Reset Password : inputs new password + confirm, CTA "Réinitialiser", token depuis URL
- [ ] Post-reset → redirect E1 + toast "Mot de passe modifié"
- [ ] Token expiré/invalide → WF-AUTH-03 avec CTA "Renvoyer un lien" → E3
- [ ] Backend : `requestPasswordReset` et `resetPassword` via Better Auth (plugins forget-password / reset-password)
- [ ] Email de reset envoyé (intégration email provider ou log en dev)

**Réf. wireframes :** `E1-E2-auth.md` §WF-E3-01, §WF-E3-02, §WF-E4-01, §WF-AUTH-03
**Réf. architecture :** `api.md` §Auth, `backend.md` §Better Auth

---

#### Story 2.4 : Guards, redirections et route protégée

**En tant que** développeur,
**je veux** des guards de route côté frontend et un middleware de redirection cohérent,
**afin de** protéger les routes authentifiées et diriger les utilisateurs vers le bon écran.

**Critères d'acceptation :**

- [ ] Route layout `_authenticated` avec `beforeLoad` : redirect `/auth/login` si non authentifié, redirect `/onboarding/profile-setup` si username absent
- [ ] Routes auth (`/auth/*`) : redirect `/hub` si déjà authentifié (avec username)
- [ ] Structure de routes TanStack Router complète P1 : auth/, _authenticated/ (hub, adventure, onboarding, settings placeholder), index redirect
- [ ] `credentials: "include"` sur toutes les requêtes API (cookie de session)
- [ ] Error middleware global (`apps/api/src/middleware/error.middleware.ts`) avec gestion ZodError et AppError
- [ ] Rate limiting middleware basique (`express-rate-limit`) sur les endpoints auth
- [ ] CORS configuré avec whitelist (`FRONTEND_URL`)

**Réf. architecture :** `frontend.md` §Routing, `backend.md` §Middleware, `api.md` §Format Erreur, `infrastructure.md` §Sécurité

---

## Epic 3 — Onboarding : Setup

**Objectif :** Accueillir les nouveaux joueurs, collecter le username obligatoire, et les orienter vers le Hub.

|                  |                                                                                                                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F4 — Onboarding/Tutoriel (parcours Welcome + Profile Setup)                                                                                                                                                           |
| **Écrans**       | E5 Welcome, E6 Profile Setup                                                                                                                                                                                          |
| **Wireframes**   | `wireframes/E5-E6-E7-onboarding.md` (sections E5+E6)                                                                                                                                                                 |
| **Dépendances**  | Epic 2 (authentification)                                                                                                                                                                                             |
| **Testabilité**  | Un joueur fraîchement inscrit est redirigé vers Welcome (E5), complète son username (E6), et arrive au Hub. Le bandeau "username manquant" dans le Hub (Epic 4) disparaît après setup. Skip possible à chaque étape. |

**Scope :**

- E5 — Welcome :
  - Page de bienvenue + explication du concept JDRAI
  - CTA vers E6 (Profile Setup) ou skip direct Hub
- E6 — Profile Setup :
  - Collecte du username (obligatoire pour lancer une aventure)
  - Validation unicité username (API)
  - Avatar placeholder
- Pages plein écran (sidebar masquée, flow linéaire)
- Redirection post-inscription → E5 Welcome (si premier login)
- Redirection post-E6 → Hub
- Mécanismes de flexibilité P1 :
  - Skip possible à chaque étape (accès direct Hub sans username)
  - Rappel non-intrusif dans le Hub (bandeau → redirect vers E6) — implémenté dans Epic 4

**Hors scope :**

- Avatar personnalisé (sélection cosmétique) — P2
- Background/origine méta-personnage — P2
- Tutoriel aventure (Epic 8)

### Stories

#### Story 3.1 : E5 Welcome — Page de bienvenue

**En tant que** nouveau joueur,
**je veux** être accueilli par une page immersive après mon inscription,
**afin de** comprendre le concept JDRAI avant de configurer mon profil.

**Critères d'acceptation :**

- [ ] Route `/onboarding/welcome` accessible uniquement si authentifié
- [ ] WelcomeHero : illustration héroïque dark fantasy + logo JDRAI intégré
- [ ] Texte d'accueil immersif (pas de jargon technique) : "Votre aventure commence ici..." + description courte du concept MJ IA
- [ ] CTA "Entrer" → navigation vers E6 (profile-setup)
- [ ] Plein écran, sidebar/tab bar masquées (tunnel linéaire)
- [ ] Responsive : centré `max-width: ~480px` sur desktop, plein écran mobile
- [ ] Pas de bouton retour, pas de StepIndicator (c'est un splash)

**Réf. wireframes :** `E5-E6-E7-onboarding.md` §WF-E5-01
**Réf. architecture :** `frontend.md` §Routing (onboarding/)

---

#### Story 3.2 : E6 Profile Setup — Choix du pseudo

**En tant que** nouveau joueur,
**je veux** définir mon pseudo sur JDRAI,
**afin d'** avoir une identité pour jouer et interagir.

**Critères d'acceptation :**

- [ ] Route `/onboarding/profile-setup` accessible si authentifié
- [ ] E6-01 : StepIndicator (● ○), question narrative "Comment vous appelle-t-on, aventurier ?", input pseudo avec focus auto, aide contextuelle ("C'est votre identité sur JDRAI..."), CTA "Continuer" désactivé si champ vide
- [ ] Validation pseudo : 3-20 caractères, unicité vérifiée côté serveur
- [ ] Erreur inline si pseudo pris (WF-OB-01) : "Ce pseudo est déjà pris. Essayez 'Aldric_42' ?" (suggestion automatique)
- [ ] API : `PATCH /users/me` avec `{ username: "xxx" }` — met à jour `username` ET `name` (Better Auth)
- [ ] E6-02 : StepIndicator (○ ●), titre personnalisé "{pseudo}, êtes-vous prêt...", NarrativeBox tutoriel (~5 min), CTA "C'est parti !" → E7 (Epic 8), SkipButton "Passer et aller au Hub" → `/hub`
- [ ] Post-E6-02 (si skip) → redirect `/hub`
- [ ] Si le joueur quitte sur E6-01 sans valider le pseudo → redirect vers E6-01 à la prochaine connexion (guard `_authenticated`)
- [ ] Plein écran, sidebar/tab bar masquées

**Réf. wireframes :** `E5-E6-E7-onboarding.md` §WF-E6-01, §WF-E6-02, §WF-OB-01
**Réf. architecture :** `api.md` §Users, `backend.md` §AuthService.setUsername

---

## Epic 4 — Navigation & Hub

**Objectif :** Fournir le point d'entrée central de l'application avec la navigation globale.

|                  |                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F3 — Sauvegarde/Reprise (liste aventures), F1 — Navigation mobile-first                                                                                       |
| **Écrans**       | E8 Hub + Layout global (Sidebar, Bottom Tab Bar)                                                                                                              |
| **Wireframes**   | `wireframes/E8-hub.md`                                                                                                                                        |
| **Dépendances**  | Epic 3 (onboarding : setup)                                                                                                                                   |
| **Testabilité**  | Un utilisateur connecté voit le Hub avec empty states, la navigation fonctionne (sidebar desktop, tab bar mobile). Bandeau email verification si non vérifié. |

**Scope :**

- Layout global responsive (mobile-first)
  - Sidebar desktop (Hub, Profil, Aventure, Paramètres, Déconnexion)
  - Bottom tab bar mobile (Hub, Profil, Aventure)
  - Onglet Aventure **toujours visible** (modale si aucune aventure active)
- Routing TanStack Router (structure de routes complète P1)
- E8 — Hub :
  - Section méta-personnage simplifiée P1 (username + avatar placeholder)
  - Section aventures actives (empty state P1) + compteur (max 5) — bouton désactivé si limite atteinte
  - Section actions (Nouvelle aventure, Scénario template, Aventure aléatoire)
  - Section historique aventures terminées (empty state)
  - Bandeau email verification (si non vérifié)
  - Bandeau rappel username manquant (redirect Epic 3 — E6)
- Responsive breakpoints (mobile < 768px, desktop > 1024px)

**Hors scope :**

- Profil méta-personnage complet (P2)
- Paramètres utilisateur (P2)
- Rejoindre une partie (P3)

### Stories

#### Story 4.1 : Layout global responsive + routing

**En tant que** joueur,
**je veux** une navigation cohérente sur mobile et desktop,
**afin de** pouvoir naviguer dans l'application de manière intuitive.

**Critères d'acceptation :**

- [ ] Layout `AuthenticatedLayout` avec Sidebar (desktop > 1024px) et BottomTabBar (mobile < 768px), tablette (768–1024px) sidebar collapsée icônes
- [ ] Sidebar desktop : JDRAI logo, Hub (🏠), Profil (👤), Aventure (⚔️), séparateur, Paramètres (⚙️ P2 — lien grisé), Déconnexion (🚪)
- [ ] BottomTabBar mobile : Hub, Profil, Aventure — onglet actif visuellement marqué
- [ ] Onglet Aventure : toujours visible, ouvre une **modale** (si aventure(s) → modale reprise ; si aucune → modale invitation)
- [ ] Structure de routes TanStack Router complète : `_authenticated/hub`, `_authenticated/adventure/new`, `_authenticated/adventure/$id`, `_authenticated/adventure/$id/summary`, `_authenticated/onboarding/*`, `_authenticated/settings` (placeholder)
- [ ] Sidebar/tab bar masquées sur les routes auth et onboarding (cf. UX Cartography §3.2)
- [ ] Déconnexion fonctionnelle depuis la sidebar

**Réf. wireframes :** `E8-hub.md` §WF-E8-01, §WF-E8-07
**Réf. architecture :** `frontend.md` §Routing, §Navigation responsive

---

#### Story 4.2 : Hub — Sections principales et empty states

**En tant que** joueur,
**je veux** voir le Hub comme point d'entrée central avec mes aventures et actions disponibles,
**afin de** reprendre une aventure ou en lancer une nouvelle rapidement.

**Critères d'acceptation :**

- [ ] MetaCharacterBanner : avatar placeholder + username + titre "Apprenti aventurier" (P1) + barre XP placeholder (Niv. 1, barre vide)
- [ ] Section aventures actives : AdventureCardActive empilées verticalement (titre, milestone actuel, dernière sauvegarde, CTA "Reprendre" → `/adventure/:id`), triées par dernière sauvegarde
- [ ] Section actions : grille 3 colonnes ActionCards (⚔️ Personnalisée → `/adventure/new`, 📋 Scénario → `/adventure/new?mode=template`, 🎲 Aléatoire → `/adventure/new?mode=random`)
- [ ] Section historique : carousel horizontal mobile / grille 4 colonnes desktop, AdventureCards avec titre + date, tap → `/adventure/:id/summary`, lien "Tout >"
- [ ] Empty state (WF-E8-02) : si aucune aventure, EmptyState avec texte "C'est trop calme ici...", CTA unique "Lancer ma première aventure", lien secondaire "ou choisir un scénario"
- [ ] Loading : skeletons (WF-E8-04) reprenant la forme des composants cibles
- [ ] Erreur chargement (WF-E8-05) : message + bouton retry, MetaCharacterBanner depuis le cache si disponible
- [ ] API : `GET /adventures` (filtre status), `GET /users/me` — données via TanStack Query (stale-while-revalidate)
- [ ] Pull-to-refresh mobile

**Réf. wireframes :** `E8-hub.md` §WF-E8-01, §WF-E8-02, §WF-E8-04, §WF-E8-05, §WF-E8-07
**Réf. architecture :** `frontend.md` §State Management, `api.md` §Adventures

---

#### Story 4.3 : Hub — Bandeaux et modale Aventure

**En tant que** joueur,
**je veux** être informé si mon email n'est pas vérifié ou si mon profil est incomplet,
**afin de** sécuriser mon compte et compléter mon onboarding.

**Critères d'acceptation :**

- [ ] Bandeau email non vérifié (WF-E8-08) : fond bleu/indigo, "Vérifiez votre email...", lien "Renvoyer" (rate limited 1/60s, toast confirmation), bouton dismiss `[×]` (réapparaît chaque visite)
- [ ] Bandeau profil incomplet (WF-E8-03) : fond or/ambre, "Complétez votre profil...", bouton dismiss `[×]`, click → redirect `/onboarding/profile-setup`
- [ ] Priorité d'affichage : si les deux bandeaux actifs → profil incomplet prime (un seul bandeau)
- [ ] Bandeaux disparaissent définitivement une fois la condition résolue (email vérifié / onboarding complété)
- [ ] Modale onglet Aventure (tab bar/sidebar) : si aventure(s) en cours → titre + milestone + dernière sauvegarde + CTA "Reprendre" ; si aucune → texte invitation + CTA vers `/adventure/new`
- [ ] Toast reconnexion (WF-E8-06) : "✓ Reconnecté ! Bon retour." après re-login (disparaît après 3s)

**Réf. wireframes :** `E8-hub.md` §WF-E8-03, §WF-E8-08, §WF-E8-06, §7 Règles
**Réf. architecture :** `frontend.md` §Résilience client

---

## Epic 5 — Lancement d'aventure

**Objectif :** Permettre au joueur de configurer et lancer une nouvelle aventure solo.

|                  |                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F2 — Session solo MJ IA (partie config)                                                                                                                                               |
| **Écrans**       | E9 Lancement aventure                                                                                                                                                                 |
| **Wireframes**   | `wireframes/E9-lancement-aventure.md`                                                                                                                                                 |
| **Dépendances**  | Epic 4 (hub + navigation)                                                                                                                                                             |
| **Testabilité**  | Le joueur configure une aventure (durée, difficulté) ou choisit un template/aléatoire, et lance l'aventure. Limite de 5 aventures actives respectée (backend 409 + gestion frontend). |

**Scope :**

- E9 — Lancement aventure :
  - Mode personnalisé : durée estimée (courte/moyenne/longue — liée aux milestones), difficulté (4 niveaux : Facile/Normal/Difficile/Cauchemar)
  - Thème Heroic Fantasy appliqué par défaut — pas de sélecteur en P1 (cf. PRD F2)
  - Mode template : sélection d'un scénario préfait (2 templates seedés en Epic 1)
  - Mode aléatoire : génération LLM surprise
- Tables DB : `adventures`, `adventure_characters`, `milestones` (schéma initial)
- Personnage d'aventure P1 : création automatique (Race = Humain, Classe = Aventurier — tables seedées Epic 1, non visible joueur)
- Validation limite 5 aventures solo actives : backend (`POST /api/adventures` → 409 si limite atteinte) + gestion d'erreur frontend
- API : `POST /api/adventures` (création aventure)
- Redirection vers session de jeu (E10) après lancement

**Hors scope :**

- Sélecteur de thème/genre (Heroic Fantasy uniquement en P1, genres additionnels P4)
- Création personnage avancée (race, classe, stats) — P2
- Personnalisation MJ (ton, rigueur) — P2
- Mode multijoueur — P3

### Stories

#### Story 5.1 : Tables DB aventures + API création

**En tant que** développeur,
**je veux** les tables `adventures`, `adventure_characters`, `milestones` et `messages` avec l'API de création,
**afin de** pouvoir créer et stocker les aventures côté serveur.

**Critères d'acceptation :**

- [ ] Schémas Drizzle : `adventures` (id, userId, templateId nullable, title, status enum, difficulty enum, estimatedDuration enum, settings jsonb, state jsonb, timestamps), `adventure_characters` (id, adventureId, classId, raceId, name, stats jsonb, currentHp, maxHp), `milestones` (id, adventureId, name, description, sortOrder, status enum, timestamps), `messages` (id, adventureId, milestoneId nullable, role enum, content, metadata jsonb, createdAt)
- [ ] Migrations générées et applicables
- [ ] `POST /api/adventures` : crée l'aventure + personnage automatique (Race Humain, Classe Aventurier si pas de méta-personnage), valide limite 5 actives → 409 `MAX_ACTIVE_ADVENTURES` si dépassé
- [ ] `GET /api/adventures` : liste aventures du user, filtre par `?status=active|completed|abandoned`
- [ ] `GET /api/adventures/:id` : détail avec `currentMilestone` (dérivé du milestone `status = "active"`)
- [ ] `GET /api/templates` : liste des templates disponibles
- [ ] DTOs partagés exportés dans `packages/shared` : `AdventureDTO`, `AdventureCreateInput`, `AdventureCharacterDTO`, `MilestoneDTO`
- [ ] Schémas Zod de validation pour `AdventureCreateInput`

**Réf. architecture :** `data-models.md` §ERD, §Milestones, §Valeurs par défaut, `api.md` §Adventures, §Reference Data

---

#### Story 5.2 : E9 frontend — Config personnalisée et templates

**En tant que** joueur,
**je veux** configurer ma nouvelle aventure (durée et difficulté) ou choisir un scénario préfait,
**afin de** personnaliser mon expérience de jeu.

**Critères d'acceptation :**

- [ ] Route `/adventure/new` avec header "← Nouvelle aventure" (retour Hub)
- [ ] WF-E9-01 Config personnalisée : DurationSelector (3 options : ⚡ Courte ~20 min, ⚔️ Moyenne ~45 min, 📖 Longue ~1h+), DifficultySlider (4 crans : Facile/Normal/Difficile/Cauchemar) avec description dynamique par cran (cf. GDD §9.1), valeurs par défaut Moyenne + Normal
- [ ] WF-E9-02 Templates : liste TemplateCards (icône, nom, durée, difficulté, description, CTA "Choisir")
- [ ] WF-E9-03 Confirmation : récap paramètres (Univers Heroic Fantasy, Durée, Difficulté, Personnage), CTA "Lancer l'aventure", lien "Modifier les paramètres"
- [ ] WF-E9-06 Limite atteinte : bandeau bloquant avec liste des 5 aventures actives, menu contextuel `[⋮]` (Reprendre/Abandonner), config inaccessible tant que limite atteinte
- [ ] WF-E9-07 Modale abandon : confirmation + bouton destructif rouge
- [ ] Sidebar/tab bar visibles (navigation libre, pas en session)
- [ ] Entrée depuis Hub : 3 chemins (Personnalisée → E9-01, Scénario → E9-02, Aléatoire → E9-03b)

**Réf. wireframes :** `E9-lancement-aventure.md` §WF-E9-01, §WF-E9-02, §WF-E9-03, §WF-E9-06, §WF-E9-07, §WF-E9-08
**Réf. architecture :** `frontend.md` §Components (adventure/)

---

#### Story 5.3 : E9 frontend — Mode aléatoire, loading et lancement

**En tant que** joueur,
**je veux** pouvoir lancer une aventure aléatoire et voir le chargement de génération,
**afin de** vivre une expérience surprise et savoir que mon aventure se prépare.

**Critères d'acceptation :**

- [ ] WF-E9-03b Choix surprise : icône 🎲, "Le destin a parlé.", CTA "Révéler mon destin" → E9-03c, CTA secondaire "Accepter l'inconnu" → E9-04 (params masqués)
- [ ] WF-E9-03c Confirmation aléatoire : paramètres révélés, CTA "Lancer l'aventure", lien "Retirer les dés" → relance le tirage
- [ ] WF-E9-04 Loading génération : plein écran, icône thématique animée, texte "Le Maître du Jeu prépare votre aventure...", barre de progression indéterminée, récap paramètres (ou message mystérieux si "Accepter l'inconnu")
- [ ] WF-E9-05 Échec génération : message immersif, CTA "Réessayer", lien "Retour à la configuration" (paramètres conservés), retry auto x2 invisible avant affichage erreur
- [ ] Appel `POST /api/adventures` depuis le loading, gestion erreur 409 (limite) et erreurs LLM
- [ ] Post-création → redirect `/adventure/:id` (E10)
- [ ] Navigation masquée pendant le loading (transition entre config et session)

**Réf. wireframes :** `E9-lancement-aventure.md` §WF-E9-03b, §WF-E9-03c, §WF-E9-04, §WF-E9-05
**Réf. architecture :** `frontend.md` §API Client

---

## Epic 6 — Session de jeu

**Objectif :** Délivrer le cœur du produit : l'interaction avec le MJ IA en session d'aventure.

|                  |                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Features PRD** | F2 — Session solo MJ IA (partie gameplay), F1 — Résilience session                                                                                                                                                       |
| **Écrans**       | E10 Session de jeu                                                                                                                                                                                                       |
| **Wireframes**   | `wireframes/E10-session-de-jeu.md`                                                                                                                                                                                       |
| **Dépendances**  | Epic 5 (lancement aventure)                                                                                                                                                                                              |
| **Testabilité**  | Le joueur joue une aventure complète : narration MJ IA (Le Chroniqueur), choix hybrides, D20 en arrière-plan, CharacterPanel avec HP visible, milestones, sauvegarde auto, menu in-game, quitter avec confirmation. Gestion 429 et reconnexion fonctionnelles. |

**Scope :**

- Intégration LLM multi-provider (streaming) :
  - Abstraction provider (cf. architecture backend.md)
  - Persona **"Le Chroniqueur"** (cf. GDD §4) : system prompt avec personnalité définie + adaptation du ton par difficulté (Facile → encourageant, Normal → standard, Difficile → austère, Cauchemar → menaçant)
  - **Système D20 côté serveur (GD-001)** : roll D20 par action significative, injection résultat + DC contextuel + consigne de narration dans le prompt MJ — jamais visible joueur en P1
  - **Fail forward logic (GD-002)** : règles injectées dans le prompt selon difficulté (Facile/Normal = issue narrative garantie, Difficile = dernière chance, Cauchemar = game over autorisé)
  - **Parsing signaux LLM** par GameService : `[MILESTONE_COMPLETE:nom]`, `[HP_CHANGE:x]`, `[ADVENTURE_COMPLETE]`, `[GAME_OVER]`
  - Prompt system pour choix suggérés (2-4) + texte libre
  - Streaming des réponses (texte progressif)
- Interface de jeu :
  - Zone narration MJ (texte + mise en forme)
  - Choix suggérés (2-4 boutons)
  - Zone saisie libre
  - **CharacterPanel P1 (GD-006)** : panneau minimaliste nom · classe · ❤️ HP dans E10
  - Sidebar/tab bar masquée en session (navigation immersive)
- Structure par milestones :
  - Le MJ IA pilote les milestones (basés sur la durée configurée)
  - Overlay célébration milestone (WF-E10-12) : titre en overlay style RPG → fondu retour narration
  - Intro session fade-in (WF-E10-13)
  - Historique drawer groupé par milestones (WF-E10-07)
  - Nom du milestone en cours affiché (pas de progression numérique)
- Menu in-game (style jeu vidéo, pas burger classique) :
  - Quitter (avec sauvegarde auto)
  - Sauvegarder manuellement
- Confirmation de sortie (changement de page, déconnexion, fermeture onglet)
- Auto-save continu (état aventure)
- Résilience session :
  - Rate limiting 429 : désactivation saisie, message utilisateur, réactivation après délai
  - Reconnexion basique : message non-bloquant, auto-reconnexion, reprise dernier état

**Hors scope :**

- Inventaire joueur (GD-007 : géré narrativement par le MJ en P1) — P2
- Paramètres MJ en session (drawer ajustements) — P2
- Events narratifs entre milestones — P2
- Bouton "MJ bloqué" — P2
- Option "dés visibles" (D20 visible joueur) — P2
- Génération d'images — P3

### Stories

#### Story 6.1 : Abstraction LLM multi-provider + streaming

**En tant que** développeur,
**je veux** une abstraction LLM avec support multi-provider et streaming,
**afin de** pouvoir interagir avec différents modèles d'IA de manière interchangeable.

**Critères d'acceptation :**

- [ ] Interface `LLMProvider` (`generateResponse`, `streamResponse`) dans `apps/api/src/modules/game/llm/llm.provider.ts`
- [ ] Implémentation `OpenAIProvider` (streaming via SDK OpenAI)
- [ ] Implémentation `AnthropicProvider` (streaming via SDK Anthropic)
- [ ] `LLMService` avec stratégie multi-provider : primary + fallback, switch automatique en cas d'erreur
- [ ] Factory provider basé sur `LLM_PRIMARY_PROVIDER` (env)
- [ ] Streaming des réponses via callback `onChunk`
- [ ] Gestion timeout et erreurs (retry interne, logging)
- [ ] Tests unitaires : mock provider, fallback, streaming

**Réf. architecture :** `backend.md` §Intégration LLM, §Architecture Provider, §Stratégie Multi-Provider

---

#### Story 6.2 : System prompt Le Chroniqueur + D20 + fail forward

**En tant que** développeur,
**je veux** le système de prompts du MJ "Le Chroniqueur" avec le D20 et le fail forward,
**afin de** produire des narrations immersives adaptées à la difficulté du joueur.

**Critères d'acceptation :**

- [ ] System prompt "Le Chroniqueur" : personnalité (chaleureux + épique), ton adapté par difficulté (Facile → encourageant, Normal → standard, Difficile → austère, Cauchemar → menaçant), règles de narration (tutoiement, présent, jamais de 4e mur, jamais de mécaniques explicites)
- [ ] Système D20 côté serveur (GD-001) : roll `Math.random()` 1-20 par action significative, DC de base par type d'action (5/8/12/15/18), modificateurs difficulté (Easy -3, Normal 0, Hard +2, Nightmare +4), bonus personnage (+2 classe, +1 contexte, -2 répétition)
- [ ] Injection D20 dans le prompt MJ : bloc `[SYSTÈME — INVISIBLE]` avec roll, DC, bonus, outcome (SUCCÈS CRITIQUE / NET / PARTIEL / ÉCHEC NARRATIF / CRITIQUE), consigne narrative
- [ ] Fail forward (GD-002) : instructions dans le prompt selon difficulté — Facile/Normal = issue narrative garantie, Difficile = dernière chance, Cauchemar = game over autorisé
- [ ] Stockage roll dans `Message.metadata` (pour feature "dés visibles" P2)
- [ ] Prompt pour choix suggérés : le MJ propose 2-4 choix en fin de narration + le joueur peut écrire librement
- [ ] Context window : historique récent + milestone actif + worldState compressé

**Réf. architecture :** `backend.md` §Prompt System MJ, §Injection D20, §Signaux structurés
**Réf. GDD :** GD-001 (D20), GD-002 (Fail forward), §4 (Le Chroniqueur)

---

#### Story 6.3 : GameService — signaux LLM, milestones et auto-save

**En tant que** développeur,
**je veux** un GameService qui orchestre le cycle de jeu (signaux LLM, milestones, sauvegarde),
**afin de** maintenir l'état de l'aventure de manière cohérente.

**Critères d'acceptation :**

- [ ] `GameService` orchestre : réception action joueur → D20 → appel LLM → parsing réponse → mise à jour état → réponse client
- [ ] Parsing signaux LLM par regex : `[MILESTONE_COMPLETE:nom]` → milestone `completed` + suivant `active`, `[HP_CHANGE:x]` → update `currentHp` (clamp 0 à maxHp), `[ADVENTURE_COMPLETE]` → aventure `completed`, `[GAME_OVER]` → aventure `completed` (contexte échec)
- [ ] Signaux supprimés du texte affiché au joueur (nettoyage avant streaming/affichage)
- [ ] Gestion milestones : création initiale au lancement (LLM génère noms + descriptions basés sur `estimatedDuration`), premier milestone `active`, transitions via signaux
- [ ] Auto-save : sauvegarde état après chaque échange complet (choix joueur + réponse MJ) dans `Adventure.state` jsonb
- [ ] `POST /api/adventures/:id/action` : endpoint action joueur (texte libre ou choiceId)
- [ ] `GET /api/adventures/:id/state` : état actuel (GameStateDTO : adventure + messages + milestones + isStreaming)
- [ ] `GET /api/adventures/:id/messages` avec filtre `?milestoneId=` (pour HistoryDrawer)
- [ ] Messages stockés avec `milestoneId` FK (taggés avec le milestone actif au moment de la création)

**Réf. architecture :** `backend.md` §Signaux structurés, §Gestion Milestones, `data-models.md` §GameStateDTO, `api.md` §Game

---

#### Story 6.4 : Interface de jeu — NarrationPanel, ChoiceList, FreeInput

**En tant que** joueur,
**je veux** une interface de jeu immersive avec la narration du MJ, des choix et une saisie libre,
**afin de** vivre mon aventure de manière interactive.

**Critères d'acceptation :**

- [ ] Route `/adventure/:id` — plein écran, sidebar/tab bar masquées
- [ ] NarrationPanel : zone scrollable, style parchemin, affichage scène actuelle uniquement (paradigme "scène focalisée")
- [ ] StreamingText : texte apparaît mot par mot avec curseur clignotant (WF-E10-02)
- [ ] ChoiceList inline (dans le flux de narration) : 2-4 ChoiceButtons, n'apparaissent qu'après la fin du streaming
- [ ] FreeInput fixe en bas : champ saisie libre + bouton envoi `[➤]` + bouton historique `📜`
- [ ] Input lock : FreeInput et ChoiceButtons désactivés pendant loading (WF-E10-03) et streaming (WF-E10-02)
- [ ] Écho du choix joueur (WF-E10-04) : affiché brièvement en haut de la scène (stylisé, italique)
- [ ] LoadingNarration (WF-E10-03) : animation thématique "Le MJ consulte ses parchemins..."
- [ ] Desktop (WF-E10-11) : NarrationPanel centré `max-width: ~720px`, même structure que mobile
- [ ] Keyboard desktop : touches 1-4 pour choix, Enter pour saisie libre, Escape pour menu pause

**Réf. wireframes :** `E10-session-de-jeu.md` §WF-E10-01, §WF-E10-02, §WF-E10-03, §WF-E10-04, §WF-E10-11
**Réf. architecture :** `frontend.md` §Components (game/)

---

#### Story 6.5 : CharacterPanel, SessionHeader et menu pause

**En tant que** joueur,
**je veux** voir mon personnage et accéder au menu pause en session,
**afin de** suivre mes HP et pouvoir quitter/sauvegarder à tout moment.

**Critères d'acceptation :**

- [ ] SessionHeader fixe : titre aventure + icône menu pause `[⚙]` (style thématique RPG)
- [ ] CharacterPanel compact fixe sous le header (GD-006) : nom · classe · ❤️ currentHp/maxHp — mis à jour en temps réel sur signal `[HP_CHANGE:x]`
- [ ] AutosaveIndicator : "✓ Sauvegardé" visible brièvement (2s) sous le header après chaque auto-save
- [ ] Menu pause overlay (WF-E10-05) : fond sombre semi-transparent, boutons 💾 Sauvegarder, 🎭 Paramètres MJ (grisé P1), 📜 Historique, 🚪 Quitter l'aventure, lien "Reprendre", info dernière sauvegarde
- [ ] Sauvegarde manuelle depuis le menu pause (appel API)
- [ ] Desktop : CharacterPanel dans le header (plus d'espace horizontal)

**Réf. wireframes :** `E10-session-de-jeu.md` §WF-E10-01, §WF-E10-05, §WF-E10-11, §7 Règles (CharacterPanel, Milestone overlay)
**Réf. GDD :** GD-006 (CharacterPanel)

---

#### Story 6.6 : Historique drawer, milestone overlay et intro session

**En tant que** joueur,
**je veux** consulter l'historique, voir les celebrations de milestones et l'intro narrative,
**afin de** suivre ma progression et vivre des moments épiques.

**Critères d'acceptation :**

- [ ] HistoryDrawer (WF-E10-07) : plein écran mobile / panneau latéral desktop, messages groupés par MilestoneHeaders, milestone actif marqué "● en cours", lecture seule, scroll vers milestone actif à l'ouverture
- [ ] Accessible via bouton `📜` dans FreeInput et via menu pause
- [ ] MilestoneOverlay (WF-E10-12) : overlay "✦ Nom du milestone ✦" texte doré sur fond assombri, sous-titre "Un nouveau chapitre commence...", durée 2-3s, fade-out automatique, pas d'overlay pour le premier milestone
- [ ] Intro session fade-in (WF-E10-13) : texte court "Il était une fois..." en fade-in progressif, plein écran, uniquement au premier lancement (pas à la reprise), s'enchaîne vers le streaming première narration MJ

**Réf. wireframes :** `E10-session-de-jeu.md` §WF-E10-07, §WF-E10-12, §WF-E10-13
**Réf. architecture :** `frontend.md` §Historique par milestones

---

#### Story 6.7 : Confirmation de sortie et navigation bloquée

**En tant que** joueur,
**je veux** être protégé contre les sorties accidentelles de ma session de jeu,
**afin de** ne pas perdre ma progression ou interrompre mon aventure par erreur.

**Critères d'acceptation :**

- [ ] Modale confirmation sortie (WF-E10-06) : "Quitter l'aventure ?", message rassurant "Votre progression est sauvegardée", info dernière sauvegarde, boutons "Quitter" et "Rester"
- [ ] Déclencheurs : bouton "Quitter" menu pause, bouton retour navigateur, navigation vers autre route (route guard TanStack Router), `beforeunload` (fermeture onglet/refresh)
- [ ] "Quitter" → sauvegarde auto + redirect `/hub`
- [ ] "Rester" → ferme la modale, retour à la session
- [ ] `beforeunload` : confirmation navigateur native (limitation technique — pas de modale custom)
- [ ] Hook `useGameSession` : gestion du state `isInGameSession` pour le `beforeunload`

**Réf. wireframes :** `E10-session-de-jeu.md` §WF-E10-06, §7 Règles (Navigation bloquée)
**Réf. architecture :** `frontend.md` §Navigation en session de jeu

---

#### Story 6.8 : Résilience session — 429, reconnexion et erreurs LLM

**En tant que** joueur,
**je veux** que ma session résiste aux erreurs réseau et aux limites de débit,
**afin de** continuer à jouer sans perdre ma progression.

**Critères d'acceptation :**

- [ ] Rate limiting 429 (WF-E10-09) : choix visibles mais grisés, message thématique "Le MJ reprend son souffle..." + compteur visible (Retry-After), input verrouillé 🔒 avec compteur, réactivation automatique à la fin du compteur
- [ ] Intercepteur 429 dans `api.ts` : émission événement `rate-limited` avec `retryAfter`
- [ ] Perte de connexion (WF-E10-08) : bandeau non-bloquant "⚠️ Connexion perdue — Reconnexion en cours...", dernière narration reste visible, input désactivé "Reconnexion... ░░░"
- [ ] Reconnexion Socket.io : auto-reconnexion native, événement `reconnect` → `game:resync` (recharge état depuis dernier auto-save), bandeau disparaît
- [ ] Erreur LLM (WF-E10-10) : retry auto x3 invisible, après 3 échecs → message thématique "Le MJ a renversé son encrier..." + bouton retry manuel, input réactivé (le joueur peut reformuler)
- [ ] Messages d'erreur localisés français (mapping `ErrorCode` → message)

**Réf. wireframes :** `E10-session-de-jeu.md` §WF-E10-08, §WF-E10-09, §WF-E10-10
**Réf. architecture :** `frontend.md` §Résilience client, §Perte de connexion

---

## Epic 7 — Fin d'aventure & Cycle de vie

**Objectif :** Compléter la boucle de jeu avec l'écran de fin, la reprise et la gestion du cycle de vie des aventures.

|                  |                                                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F2 — Session solo (fin), F3 — Sauvegarde/Reprise                                                                                                                           |
| **Écrans**       | E11 Écran de fin                                                                                                                                                           |
| **Wireframes**   | `wireframes/E11-ecran-de-fin.md`                                                                                                                                           |
| **Dépendances**  | Epic 6 (session de jeu)                                                                                                                                                    |
| **Testabilité**  | Le joueur termine une aventure (succès ou game over), voit le récap par milestones, retourne au Hub. Il peut reprendre une aventure sauvegardée, ou l'abandonner. L'historique est consultable. |

**Scope :**

- E11 — Écran de fin (3 états) :
  - **Succès (WF-01)** : résumé narratif, milestones atteints, placeholder récompenses, retour Hub
  - **Game Over (WF-02)** : statut `completed`, ton solennel ("Votre quête s'achève ici..."), milestones atteints présentés comme héritage du personnage, placeholder récompenses (XP réduite P2)
  - **Abandonné (WF-05)** : confirmation abandon + retour Hub direct (pas d'écran de fin)
- Cycle de vie des aventures :
  - Statuts : `active` | `completed` | `abandoned`
  - Reprise d'aventure (depuis Hub, reprise au dernier état sauvegardé)
  - Abandon d'aventure (confirmation, libère un slot sur les 5)
  - Historique aventures terminées (liste dans le Hub)
- API complémentaires :
  - `PATCH /api/adventures/:id` (changement de statut)
  - `GET /api/adventures` (liste avec filtres : active, completed, abandoned)

**Hors scope :**

- Rewards fonctionnels (XP, achievements) — P2
- Events découverts dans le récap — P2

### Stories

#### Story 7.1 : API cycle de vie aventures

**En tant que** développeur,
**je veux** les endpoints de gestion du cycle de vie des aventures (statuts, reprise, abandon),
**afin de** supporter la boucle complète de jeu côté serveur.

**Critères d'acceptation :**

- [ ] `PATCH /api/adventures/:id` : changement de statut (`active` → `completed`, `active` → `abandoned`), validation transitions valides, mise à jour `completedAt` si completed
- [ ] Reprise d'aventure : `GET /api/adventures/:id/state` retourne le dernier état sauvegardé (GameStateDTO complet), le frontend recharge la session E10
- [ ] Abandon : passe le statut à `abandoned`, libère un slot (compteur aventures actives décrémenté)
- [ ] Génération résumé narratif via LLM à la fin de l'aventure (`[ADVENTURE_COMPLETE]` ou `[GAME_OVER]`) : texte immersif 2-4 phrases, stocké dans l'aventure
- [ ] `GET /api/adventures/:id/milestones` : liste ordonnée des milestones avec statuts
- [ ] Filtrage `GET /api/adventures?status=completed` pour l'historique Hub

**Réf. architecture :** `api.md` §Adventures, `data-models.md` §Adventure, `backend.md` §Signaux structurés

---

#### Story 7.2 : E11 Écran de fin — Succès et Game Over

**En tant que** joueur,
**je veux** voir un écran de fin immersif après avoir terminé une aventure,
**afin de** célébrer ma réussite ou honorer mon parcours.

**Critères d'acceptation :**

- [ ] Route `/adventure/:id/summary` — sidebar/tab bar visibles (navigation libre)
- [ ] WF-E11-01 Succès : animation célébration 🎉 (confettis), titre "Aventure terminée !", SummaryCard (résumé narratif LLM), MilestoneRecap (liste ordonnée ✓), placeholder récompenses ("Bientôt disponible..."), CTA "Retour au Hub", lien "Rejouer ce scénario"
- [ ] WF-E11-02 Game Over : icône ☠️ statique (pas d'animation festive), titre "Votre quête s'achève ici.", SummaryCard ton solennel "Votre héritage" (épique, jamais humiliant), milestones atteints avant l'échec seulement (pas de spoil), placeholder récompenses, CTA "Retour au Hub", lien "Retenter ce scénario"
- [ ] WF-E11-03 Skeleton loading : animation jouée immédiatement, données en cascade (titre → milestones → récompenses → résumé LLM)
- [ ] WF-E11-04 Erreur résumé : message inline dans SummaryCard, retry partiel (reste de la page fonctionnel)
- [ ] Animation célébration jouée une seule fois (première visite depuis E10), consultations ultérieures (historique) = statique
- [ ] Desktop (WF-E11-07) : 2 colonnes (résumé gauche, milestones droite), récompenses pleine largeur
- [ ] "Rejouer/Retenter" → `/adventure/new` avec mêmes paramètres (nouveau seed narratif)

**Réf. wireframes :** `E11-ecran-de-fin.md` §WF-E11-01, §WF-E11-02, §WF-E11-03, §WF-E11-04, §WF-E11-07
**Réf. GDD :** §6.2-6.4 (Game Over, récompenses)

---

#### Story 7.3 : Abandon, historique et intégration Hub

**En tant que** joueur,
**je veux** pouvoir abandonner une aventure et consulter mon historique,
**afin de** gérer mes aventures et revoir mes exploits passés.

**Critères d'acceptation :**

- [ ] Abandon depuis Hub (menu contextuel aventure) ou E9-06 (limite atteinte) : modale confirmation (WF-E9-07), appel `PATCH /api/adventures/:id` status `abandoned`, libère un slot
- [ ] WF-E11-05 Aventure abandonnée (consultation historique) : titre "Aventure inachevée" (pas de célébration), SummaryCard factuel, milestones atteints seulement (pas de spoil), teaser narratif statique "Cette histoire avait encore des chemins inexplorés...", pas de récompenses, CTA "Retour au Hub" + "Retenter"
- [ ] WF-E11-06 Erreur backend globale : message rassurant "Vos données ne sont pas perdues", CTA retry + retour Hub
- [ ] Intégration Hub : section historique affiche les aventures `completed` et `abandoned`, tap → `/adventure/:id/summary`
- [ ] URL persistante : le résumé est accessible indéfiniment depuis l'historique
- [ ] Reprise aventure depuis Hub : tap "Reprendre" sur AdventureCardActive → charge `/adventure/:id` avec état sauvegardé (pas d'intro session fade-in)

**Réf. wireframes :** `E11-ecran-de-fin.md` §WF-E11-05, §WF-E11-06, `E8-hub.md` §WF-E8-01
**Réf. architecture :** `api.md` §Adventures

---

## Epic 8 — Onboarding : Tutorial

**Objectif :** Offrir une première aventure guidée aux nouveaux joueurs, créant le méta-personnage initial.

|                  |                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Features PRD** | F4 — Onboarding/Tutoriel (tutoriel aventure)                                                                                                                 |
| **Écrans**       | E7 Tutorial (= E10 en mode guidé)                                                                                                                            |
| **Wireframes**   | `wireframes/E5-E6-E7-onboarding.md` (section E7)                                                                                                            |
| **Dépendances**  | Epic 7 (fin d'aventure & cycle de vie — boucle complète nécessaire)                                                                                          |
| **Testabilité**  | Un nouveau joueur peut accéder au tutoriel depuis l'onboarding ou le Hub. Le tutoriel fonctionne comme une session guidée (E10). Le méta-personnage initial est créé. Skip possible. Tutoriel rejouable depuis le Hub. |

**Scope :**

- E7 — Tutoriel :
  - = Session de jeu (E10) en mode guidé/accompagné
  - Prompts spécifiques tutoriel : le MJ guide le joueur pas à pas (mécaniques expliquées naturellement dans la narration)
  - Personnage créé pour cette aventure = méta-personnage initial (Race Humain, Classe Aventurier)
- Accès au tutoriel :
  - Depuis l'onboarding (post-E6, CTA avant Hub)
  - Depuis le Hub (section dédiée, rejouable à tout moment)
  - Skip possible → accès direct Hub

**Hors scope :**

- Création méta-personnage avancée (background, cosmétiques) — P2
- Parcours "Rejoindre un ami" — P3

### Stories

#### Story 8.1 : Backend tutoriel — Prompts guidés et méta-personnage

**En tant que** développeur,
**je veux** un mode tutoriel dans le GameService avec des prompts guidés et la création du méta-personnage,
**afin de** offrir une première aventure pédagogique qui crée l'identité du joueur.

**Critères d'acceptation :**

- [ ] Flag `isTutorial` sur l'aventure (ou template spécifique) pour activer le mode guidé
- [ ] System prompt tutoriel : Le Chroniqueur en mode accompagnant, guide le joueur pas à pas, explique les mécaniques naturellement dans la narration (sans briser l'immersion)
- [ ] Séquence tutoriel : intro → choix de race (intégré dans la narration) → choix de classe (intégré) → 1-2 scènes de gameplay → conclusion
- [ ] Durée courte : 2-3 milestones (~5 min)
- [ ] Création méta-personnage à la fin : table `meta_characters` (ou champs user), race + classe choisies pendant le tutoriel
- [ ] Si skip tutoriel : pas de méta-personnage (défauts : Humain/Aventurier pour les aventures futures)
- [ ] Tutoriel non sauvegardé si abandonné (trop court pour justifier une reprise)
- [ ] API : flag pour identifier une aventure tutoriel dans `GET /adventures`

**Réf. architecture :** `data-models.md` §MetaCharacter, §Valeurs par défaut, `backend.md` §Prompt System MJ
**Réf. wireframes :** `E5-E6-E7-onboarding.md` §7 Règles (Tutoriel = vraie session, Création contextuelle)

---

#### Story 8.2 : E7 Interface tutoriel — Tooltips, PresetSelector et fin

**En tant que** nouveau joueur,
**je veux** un tutoriel guidé avec des bulles d'aide et des choix de personnage intégrés à l'histoire,
**afin d'** apprendre à jouer de manière naturelle et créer mon personnage.

**Critères d'acceptation :**

- [ ] Route `/onboarding/tutorial` — utilise la structure E10 complète avec des composants spécifiques en overlay
- [ ] TutorialTooltip : bulle de guidage semi-transparente, max 3 dans tout le tutoriel (1. premier choix, 2. première saisie libre, 3. menu pause), fermeture via "Compris !", ne réapparaît plus
- [ ] PresetSelector (WF-E7-02, WF-E7-03) : remplace ChoiceButtons pour les moments race/classe, cartes visuellement plus riches (icône + nom + trait), dans le flux narratif, saisie libre reste active (le joueur peut répondre autrement)
- [ ] TutorialEndCard (WF-E7-04) : plein écran, animation célébration 🎉, "Aventure terminée !", personnage révélé (avatar + race + classe), CTA "Découvrir le Hub" → `/hub`
- [ ] Accès tutoriel : depuis E6-02 ("C'est parti !") → `/onboarding/tutorial`, depuis le Hub (section dédiée, rejouable)
- [ ] Menu pause E10 en tutoriel : "Quitter" = abandonner le tutoriel → redirect Hub (pas de sauvegarde)
- [ ] Erreurs E7 héritées de E10 (WF-OB-02) : perte connexion, rate limiting, erreur LLM — aucune adaptation spécifique

**Réf. wireframes :** `E5-E6-E7-onboarding.md` §WF-E7-01, §WF-E7-02, §WF-E7-03, §WF-E7-04, §WF-OB-02, §WF-OB-03
**Réf. architecture :** `frontend.md` §Components (onboarding/)

---

## Matrice Epics / Features PRD

| Feature PRD                      | Epic(s) concernée(s)                                                  |
| -------------------------------- | --------------------------------------------------------------------- |
| F1 — Authentification            | Epic 2                                                                |
| F2 — Session solo MJ IA          | Epic 5 (config) + Epic 6 (gameplay) + Epic 7 (fin)                    |
| F3 — Sauvegarde/Reprise          | Epic 4 (affichage Hub) + Epic 6 (auto-save) + Epic 7 (cycle de vie)   |
| F4 — Onboarding/Tutoriel         | Epic 3 (E5+E6) + Epic 8 (E7 tutorial)                                 |
| Navigation mobile-first          | Epic 4                                                                |
| Structure narrative (Milestones) | Epic 5 (config durée) + Epic 6 (gameplay) + Epic 7 (récap)            |
| Résilience session               | Epic 6                                                                |

## Matrice Epics / Écrans

| Écran                  | Epic                                  |
| ---------------------- | ------------------------------------- |
| E1 Login               | Epic 2                                |
| E2 Register            | Epic 2                                |
| E3 Forgot Password     | Epic 2                                |
| E4 Reset Password      | Epic 2                                |
| E5 Welcome             | Epic 3                                |
| E6 Profile Setup       | Epic 3                                |
| E7 Tutorial            | Epic 8                                |
| E8 Hub                 | Epic 4                                |
| E9 Lancement aventure  | Epic 5                                |
| E10 Session de jeu     | Epic 6                                |
| E11 Écran de fin       | Epic 7                                |
| E12 Sauvegarde/reprise | Epic 4 (Hub) + Epic 7 (cycle de vie)  |

---

## Décisions de structure (v0.2)

Les 5 points d'attention identifiés en v0.1 ont été résolus le 2026-02-19 :

| # | Question | Décision |
|---|----------|----------|
| 1 | Epic 1 : Sprint 0 ou Epic ? | **Epic 1 standard** — travail tracké comme les autres. DoD précis : monorepo fonctionnel, DB accessible, CI verte. |
| 2 | Epic 6 (Session) : Trop volumineuse ? | **Garder 1 epic** — features interdépendantes, testabilité impossible par sous-epic. Découpage en ~8-10 stories bien séquencées. |
| 3 | Onboarding : Scinder en 2 ? | **Scindé en 2 epics** — E5+E6 → Epic 3 (dès après auth), E7 → Epic 8 (après boucle complète). |
| 4 | Epic 4 vs Epic 5 : Même itération ? | **Garder séparés** — tranches testables distinctes. Décision de sprint à l'exécution. |
| 5 | Limite 5 aventures : Cohérence ? | **Cohérent** — Epic 4 (UI Hub : compteur + bouton désactivé) + Epic 5 (backend : 409 + gestion frontend) couvrent les deux couches. |

---

**Document mis à jour par Bob (SM, BMAD Method) — v0.2**
**Décisions de structure validées le 2026-02-19**
