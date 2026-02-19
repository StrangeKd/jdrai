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
