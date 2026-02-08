# JDRAI — Epics P1

**Version :** 0.1 (draft SM — en attente validation PO)  
**Date :** 2026-02-08  
**Statut :** Étape 1 — Découpage SM, en attente review PO  
**Sources :** PRD v1.4 §4.2, UX Cartography v1.1 §2-4, Wireframes v0.3, Architecture v1.4

---

## Vue d'ensemble

Le P1 est découpé en **7 epics** ordonnées par dépendance technique et valeur produit. Chaque epic livre une **tranche verticale testable** (cf. PRD §8.0 — testabilité continue).

```
Epic 1 ─ Fondation technique
   └──► Epic 2 ─ Authentification (E1-E4)
           └──► Epic 3 ─ Navigation & Hub (E8)
                   └──► Epic 4 ─ Lancement d'aventure (E9)
                           └──► Epic 5 ─ Session de jeu (E10)
                                   └──► Epic 6 ─ Fin d'aventure & Cycle de vie (E11)
                                           └──► Epic 7 ─ Onboarding (E5-E7)
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
- CI basique (lint + typecheck + tests)

**Hors scope :**

- Aucune feature utilisateur
- Pas de déploiement production

---

## Epic 2 — Authentification

**Objectif :** Permettre à un utilisateur de s'inscrire, se connecter et gérer son mot de passe.

|                  |                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F1 — Authentification                                                                                                             |
| **Écrans**       | E1 Login, E2 Register, E3 Forgot Password, E4 Reset Password                                                                      |
| **Wireframes**   | `wireframes/E1-E2-auth.md`                                                                                                        |
| **Dépendances**  | Epic 1 (fondation)                                                                                                                |
| **Testabilité**  | Un utilisateur peut s'inscrire, se connecter, se déconnecter, réinitialiser son MDP. Email de vérification envoyé (non-bloquant). |

**Scope :**

- Better Auth + Drizzle adapter (cookies httpOnly, CSRF)
- Table `users` (schéma Drizzle + DTO partagé)
- Inscription (email + mot de passe, **sans username** — collecté à l'onboarding E6)
- Connexion / Déconnexion
- Mot de passe oublié → email → reset
- Email verification : `sendOnSignUp: true`, non-bloquante (accès direct post-inscription)
- Pages auth plein écran (sidebar masquée, cf. UX Cartography §3.2)
- Placeholder OAuth (séparateur visuel "ou", boutons désactivés — PRD décision)
- Redirection post-login vers onboarding (si nouveau) ou hub (si existant)
- Guards/middleware auth côté API + côté frontend (routes protégées)

**Hors scope :**

- OAuth fonctionnel (placeholder visuel uniquement)
- Username (Epic 7 — Onboarding)

---

## Epic 3 — Navigation & Hub

**Objectif :** Fournir le point d'entrée central de l'application avec la navigation globale.

|                  |                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F3 — Sauvegarde/Reprise (liste aventures), F1 — Navigation mobile-first                                                                                       |
| **Écrans**       | E8 Hub + Layout global (Sidebar, Bottom Tab Bar)                                                                                                              |
| **Wireframes**   | `wireframes/E8-hub.md`                                                                                                                                        |
| **Dépendances**  | Epic 2 (auth)                                                                                                                                                 |
| **Testabilité**  | Un utilisateur connecté voit le Hub avec empty states, la navigation fonctionne (sidebar desktop, tab bar mobile). Bandeau email verification si non vérifié. |

**Scope :**

- Layout global responsive (mobile-first)
  - Sidebar desktop (Hub, Profil, Aventure, Paramètres, Déconnexion)
  - Bottom tab bar mobile (Hub, Profil, Aventure)
  - Onglet Aventure **toujours visible** (modale si aucune aventure active)
- Routing TanStack Router (structure de routes complète P1)
- E8 — Hub :
  - Section méta-personnage simplifiée P1 (username + avatar placeholder)
  - Section aventures actives (empty state P1 : aucune aventure)
  - Section actions (Nouvelle aventure, Scénario template, Aventure aléatoire)
  - Section historique aventures terminées (empty state)
  - Bandeau email verification (si non vérifié)
  - Bandeau rappel username manquant (redirect onboarding E6)
- Responsive breakpoints (mobile < 768px, desktop > 1024px)

**Hors scope :**

- Profil méta-personnage complet (P2)
- Paramètres utilisateur (P2)
- Rejoindre une partie (P3)

---

## Epic 4 — Lancement d'aventure

**Objectif :** Permettre au joueur de configurer et lancer une nouvelle aventure solo.

|                  |                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F2 — Session solo MJ IA (partie config)                                                                                                                     |
| **Écrans**       | E9 Lancement aventure                                                                                                                                       |
| **Wireframes**   | `wireframes/E9-lancement-aventure.md`                                                                                                                       |
| **Dépendances**  | Epic 3 (hub + navigation)                                                                                                                                   |
| **Testabilité**  | Le joueur configure une aventure (thème, durée, difficulté) ou choisit un template/aléatoire, et lance l'aventure. Limite de 5 aventures actives respectée. |

**Scope :**

- E9 — Lancement aventure :
  - Mode personnalisé : thème/ambiance, durée estimée (courte/moyenne/longue — liée aux milestones), difficulté (4 niveaux : easy/normal/hard/nightmare)
  - Mode template : sélection d'un scénario préfait
  - Mode aléatoire : génération surprise
- Tables DB : `adventures`, `adventure_characters`, `milestones` (schéma initial)
- Personnage d'aventure P1 : création automatique (Race = Humain, Classe = Aventurier, hidden from user — tables seedées Epic 1)
- Validation limite 5 aventures solo actives (front + back)
- API : `POST /api/adventures` (création aventure)
- Redirection vers session de jeu (E10) après lancement

**Hors scope :**

- Création personnage avancée (race, classe, stats) — P2
- Personnalisation MJ (ton, rigueur) — P2
- Mode multijoueur — P3

---

## Epic 5 — Session de jeu

**Objectif :** Délivrer le coeur du produit : l'interaction avec le MJ IA en session d'aventure.

|                  |                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F2 — Session solo MJ IA (partie gameplay), F1 — Résilience session                                                                                                                       |
| **Écrans**       | E10 Session de jeu                                                                                                                                                                       |
| **Wireframes**   | `wireframes/E10-session-de-jeu.md`                                                                                                                                                       |
| **Dépendances**  | Epic 4 (lancement aventure)                                                                                                                                                              |
| **Testabilité**  | Le joueur joue une aventure complète : narration MJ IA, choix hybrides, milestones, sauvegarde auto, menu in-game, quitter avec confirmation. Gestion 429 et reconnexion fonctionnelles. |

**Scope :**

- Intégration LLM multi-provider (streaming)
  - Abstraction provider (cf. architecture backend.md)
  - Prompt system pour le MJ IA (narration + choix + milestones)
  - Streaming des réponses (texte progressif)
- Interface de jeu :
  - Zone narration MJ (texte + mise en forme)
  - Choix suggérés (2-4 boutons)
  - Zone saisie libre
  - Sidebar/tab bar masquée en session (navigation immersive)
- Structure par milestones :
  - Le MJ IA pilote les milestones (basés sur la durée configurée)
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

- Paramètres MJ en session (drawer ajustements) — P2
- Events narratifs entre milestones — P2
- Bouton "MJ bloqué" — P2
- Génération d'images — P3

---

## Epic 6 — Fin d'aventure & Cycle de vie

**Objectif :** Compléter la boucle de jeu avec l'écran de fin, la reprise et la gestion du cycle de vie des aventures.

|                  |                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F2 — Session solo (fin), F3 — Sauvegarde/Reprise                                                                                                                          |
| **Écrans**       | E11 Écran de fin                                                                                                                                                          |
| **Wireframes**   | `wireframes/E11-ecran-de-fin.md`                                                                                                                                          |
| **Dépendances**  | Epic 5 (session de jeu)                                                                                                                                                   |
| **Testabilité**  | Le joueur termine une aventure, voit le récap par milestones, retourne au Hub. Il peut reprendre une aventure sauvegardée, ou l'abandonner. L'historique est consultable. |

**Scope :**

- E11 — Écran de fin :
  - Résumé narratif de l'aventure
  - Récap par milestones atteints
  - Placeholder récompenses (XP, achievements — fonctionnel P2)
  - Bouton retour au Hub
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

## Epic 7 — Onboarding

**Objectif :** Offrir une première expérience guidée aux nouveaux joueurs, incluant la collecte du username et un tutoriel interactif.

|                  |                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Features PRD** | F4 — Onboarding/Tutoriel                                                                                                                          |
| **Écrans**       | E5 Welcome, E6 Profile Setup, E7 Tutorial                                                                                                         |
| **Wireframes**   | `wireframes/E5-E6-E7-onboarding.md`                                                                                                               |
| **Dépendances**  | Epic 5 (session de jeu — le tutoriel réutilise E10 en mode guidé)                                                                                 |
| **Testabilité**  | Un nouveau joueur passe par welcome → pseudo → tutoriel (aventure guidée). Skip possible à chaque étape. Le tutoriel est rejouable depuis le Hub. |

**Scope :**

- E5 — Welcome : bienvenue + explication du concept JDRAI
- E6 — Profile Setup :
  - Collecte du username (obligatoire, redirect si manquant)
  - Avatar placeholder
  - Validation unicité username
- E7 — Tutoriel :
  - = Session de jeu (E10) en mode guidé/accompagné
  - Le MJ guide le joueur pas à pas (prompts spécifiques tutoriel)
  - Personnage créé = méta-personnage initial (Race Humain, Classe Aventurier)
- Mécanismes de flexibilité :
  - Skip tutoriel possible (accès direct Hub)
  - Profil incomplet fonctionnel (username uniquement)
  - Rappel non-intrusif dans le Hub pour compléter
  - Tutoriel rejouable depuis le Hub
- Pages onboarding plein écran (sidebar masquée, flow linéaire)
- Redirection post-inscription → onboarding (si premier login)

**Hors scope :**

- Création méta-personnage avancée (background, cosmétiques) — P2
- Parcours "Rejoindre un ami" — P3

---

## Matrice Epics / Features PRD

| Feature PRD                      | Epic(s) concernée(s)                                                |
| -------------------------------- | ------------------------------------------------------------------- |
| F1 — Authentification            | Epic 2                                                              |
| F2 — Session solo MJ IA          | Epic 4 (config) + Epic 5 (gameplay) + Epic 6 (fin)                  |
| F3 — Sauvegarde/Reprise          | Epic 3 (affichage Hub) + Epic 5 (auto-save) + Epic 6 (cycle de vie) |
| F4 — Onboarding/Tutoriel         | Epic 7                                                              |
| Navigation mobile-first          | Epic 3                                                              |
| Structure narrative (Milestones) | Epic 4 (config durée) + Epic 5 (gameplay) + Epic 6 (récap)          |
| Résilience session               | Epic 5                                                              |

## Matrice Epics / Écrans

| Écran                  | Epic                                 |
| ---------------------- | ------------------------------------ |
| E1 Login               | Epic 2                               |
| E2 Register            | Epic 2                               |
| E3 Forgot Password     | Epic 2                               |
| E4 Reset Password      | Epic 2                               |
| E5 Welcome             | Epic 7                               |
| E6 Profile Setup       | Epic 7                               |
| E7 Tutorial            | Epic 7                               |
| E8 Hub                 | Epic 3                               |
| E9 Lancement aventure  | Epic 4                               |
| E10 Session de jeu     | Epic 5                               |
| E11 Écran de fin       | Epic 6                               |
| E12 Sauvegarde/reprise | Epic 3 (Hub) + Epic 6 (cycle de vie) |

---

## Points d'attention pour le PO

1. **Epic 1 (Fondation)** — Epic purement technique, pas de valeur utilisateur directe. Nécessaire pour tout le reste. Doit-elle rester une epic séparée ou être intégrée comme "Sprint 0" ?

2. **Epic 5 (Session de jeu)** — C'est la plus grosse epic (coeur produit). Elle inclut l'intégration LLM + l'UI + les milestones + la résilience. À valider si on la découpe en sous-epics ou si on la garde monolithique avec des stories bien découpées.

3. **Epic 7 (Onboarding) en dernier** — Le tutoriel (E7) dépend de la session de jeu (E10) puisqu'il la réutilise en mode guidé. Cela place l'onboarding en dernière position. Alternative : livrer E5+E6 (welcome + pseudo) plus tôt, et E7 (tutoriel) après Epic 5.

4. **Ordre Epic 3 vs Epic 4** — Le Hub (Epic 3) doit-il être livré avant le lancement d'aventure (Epic 4) ? Techniquement oui (le Hub est le point d'entrée), mais on pourrait envisager un Hub minimal + lancement d'aventure dans une même itération.

5. **Limite 5 aventures** — La validation est répartie entre Epic 4 (empêcher le lancement) et Epic 3 (affichage dans le Hub). Cohérence à valider.

---

**Document généré par Bob (SM, BMAD Method) — Étape 1**
**En attente : Review PO (étape 1 validation) puis priorisation avec Architect (étape 2)**
