# JDRAI - Cartographie UX (Phase 1)

**Version :** 1.1
**Date :** 2026-02-05
**Auteur :** Sally (UX Expert, BMAD Method)
**Statut :** Validé par CEO
**Référence :** `docs/prd.md` v1.4

---

## Table des matières

1. [Synthèse du design existant](#1-synthèse-du-design-existant)
2. [User Flows](#2-user-flows)
3. [Architecture de l'information](#3-architecture-de-linformation)
4. [Inventaire des écrans](#4-inventaire-des-écrans)
5. [Inventaire des composants UI](#5-inventaire-des-composants-ui)
6. [États et edge cases](#6-états-et-edge-cases)
7. [Recommandations UX](#7-recommandations-ux)

---

## 1. Synthèse du design existant

### 1.1 Design language (issu des maquettes `mockups/`)

| Élément         | Observation                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| **Ambiance**    | Dark fantasy, tons chauds (ambre, brun, or), arrière-plans atmosphériques   |
| **Surfaces**    | Textures parchemin pour les zones de contenu, fond sombre pour le contexte  |
| **Typographie** | Titrages fantasy (serif décoratif), corps en serif lisible                  |
| **Layout**      | Sidebar gauche (navigation), layouts split (info + visuel) pour les détails |
| **Composants**  | Cartes en grille avec illustration + nom, formulaires sur fond parchemin    |
| **Palette**     | Fond : brun foncé / noir — Contenu : beige / crème — Accents : or / ambre   |

### 1.2 Maquettes existantes — Statut et usage

> **Avertissement :** Les maquettes ci-dessous datent de la toute première version du projet. Elles ne doivent **pas contraindre** la conception de la nouvelle UX/UI. Seule l'authentification est considérée comme une base fiable. Les autres écrans sont de l'**inspiration libre** — les concepts, layouts et composants seront repensés en Phase 2.

| Maquette           | Usage original      | Statut nouvelle version                                                  | Remarque                                                                                                                                    |
| ------------------ | ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.png`         | Login / Register    | **Base fiable** — Adapter les champs (ajouter pseudo à l'inscription)    | Design validé, cohérent avec la direction artistique                                                                                        |
| `list_chara.png`   | Liste personnages   | **Inspiration libre** — Reconcevoir pour le Hub                          | Layout grille et cartes intéressants, mais le Hub a des besoins très différents (méta-perso, aventures en cours, actions, historique)       |
| `create_chara.png` | Création personnage | **Inspiration libre** — Reconcevoir pour la création personnage aventure | Le split layout et l'allocation de points sont de bonnes idées à explorer, mais le flow doit être repensé (presets, intégration onboarding) |
| `detail_chara.png` | Détail personnage   | **Inspiration libre** — Reconcevoir pour le profil méta-personnage       | Le concept de détail avec stats est à revoir entièrement pour la progression, succès et cosmétiques                                         |

---

## 2. User Flows

### 2.1 Flow principal — Parcours standard (nouveau joueur)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     PARCOURS STANDARD (NOUVEAU JOUEUR)                   │
│                                                                          │
│  ┌──────────┐    ┌──────────┐     ┌───────────────────────────────────┐  │
│  │  Landing │───►│ Auth     │────►│  Onboarding                       │  │
│  │  (ext.)  │    │ Register │     │                                   │  │
│  └──────────┘    └──────────┘     │  1. Bienvenue + explication       │  │
│                                   │  2. Choix prénom/pseudo           │  │
│                                   │  3. "Prêt pour l'aventure ?"      │  │
│                                   │  4. Tutoriel = 1ère aventure      │  │
│                                   │     guidée (MJ accompagne)        │  │
│                                   │  5. En cours d'aventure :         │  │
│                                   │     → Choix de race (contextuel)  │  │
│                                   │     → Choix de classe (contextuel)│  │
│                                   │     → Stats auto-assignées        │  │
│                                   │  6. Fin aventure tutoriel         │  │
│                                   │  7. Personnage → méta-personnage  │  │
│                                   │  8. Récompenses affichées         │  │
│                                   └───────────────┬───────────────────┘  │
│                                                   │                      │
│                                                   ▼                      │
│                                   ┌──────────────────────────────────┐   │
│                                   │           HUB                    │   │
│                                   │                                  │   │
│                                   │  ┌─────────────┐ ┌────────────┐  │   │
│                                   │  │ Méta-perso  │ │ Aventures  │  │   │
│                                   │  │ (résumé)    │ │ (liste)    │  │   │
│                                   │  └─────────────┘ └─────┬──────┘  │   │
│                                   │                        │         │   │
│                                   └────────────────────────┼─────────┘   │
│                                                    ┌───────┘             │
│                              ┌─────────────────────┼──────────────┐      │
│                              │                     │              │      │
│                              ▼                     ▼              ▼      │
│                   ┌───────────────────┐    ┌─────────┐        ┌──────┐   │
│                   │ Nouvelle aventure │    │Reprendre│        │Histo-│   │
│                   │                   │    │aventure │        │rique │   │
│                   │ Mode :            │    │en cours │        │      │   │
│                   │ ┌──────┐┌───────┐ │    └────┬────┘        └──────┘   │
│                   │ │ Solo ││Multi- │ │         │                        │
│                   │ │      ││joueur │ │         │                        │
│                   │ └──┬───┘└──┬────┘ │         │                        │
│                   └────┼───────┼──────┘         │                        │
│                        │       │                │                        │
│          ┌─────────────┘       └──────────┐     │                        │
│          ▼                                ▼     │                        │
│  ┌────────────────────┐    ┌──────────────────┐ │                        │
│  │ CONFIG SOLO        │    │ CONFIG MULTI (P3)│ │                        │
│  │                    │    │                  │ │                        │
│  │ 1. Paramètres :    │    │ 1. Créer partie  │ │                        │
│  │    - Thème         │    │    (= config solo│ │                        │
│  │    - Durée         │    │    + paramètres  │ │                        │
│  │    - Difficulté    │    │    multi)        │ │                        │
│  │ OU Template        │    │ OU               │ │                        │
│  │ OU Aléatoire       │    │ 2. Rejoindre     │ │                        │
│  │                    │    │    (code/lobby)  │ │                        │
│  │ 2. Création perso  │    │                  │ │                        │
│  │    d'aventure      │    │ 3. Création perso│ │                        │
│  └────────┬───────────┘    └────────┬─────────┘ │                        │
│           │                         │           │                        │
│           ▼                         ▼           ▼                        │
│  ┌──────────────────────────────────────────────────┐                    │
│  │            SESSION DE JEU                        │                    │
│  │                                                  │                    │
│  │  Narration MJ IA                                 │                    │
│  │  + Choix suggérés (2-4)                          │                    │
│  │  + Saisie libre                                  │                    │
│  │  + Auto-save continu                             │                    │
│  │                                                  │                    │
│  │  [Quitter] → Sauvegarde auto                     │                    │
│  │  [Fin aventure] → Récompenses                    │                    │
│  └──────────────────────────────────────────────────┘                    │
│                                   │                                      │
│                                   ▼                                      │
│                   ┌──────────────────────────────────┐                   │
│                   │      ÉCRAN DE FIN                │                   │
│                   │  Résumé + XP + Récompenses       │                   │
│                   │  [Retour au Hub]                 │                   │
│                   └──────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Points de décision utilisateur dans ce flow :**

| Étape                   | Décision             | Options                                     | Persona cible  |
| ----------------------- | -------------------- | ------------------------------------------- | -------------- |
| Onboarding étape 3      | Lancer le tutoriel ? | Oui (recommandé) / Skip (hub direct)        | Tous           |
| Hub                     | Que faire ?          | Nouvelle aventure / Reprendre / Voir profil | Tous           |
| Nouvelle aventure       | Comment configurer ? | Paramètres / Template / Aléatoire           | Solo + Curieux |
| Création perso aventure | Comment créer ?      | Preset / Depuis méta-perso / Manuel         | Tous           |
| Session de jeu          | Comment agir ?       | Choix suggéré / Texte libre                 | Tous           |

### 2.2 Flow secondaire — Parcours "Rejoindre un ami"

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  PARCOURS "REJOINDRE UN AMI"                            │
│                                                                         │
│  ┌───────────┐    ┌──────────┐    ┌──────────────────────────────────┐  │
│  │ Lien      │───►│ Auth     │───►│  Profil express                  │  │
│  │ invitation│    │ Register │    │                                  │  │
│  └───────────┘    └──────────┘    │  1. "Un ami vous attend !"       │  │
│                                   │  2. Choix pseudo uniquement      │  │
│                                   │  3. Personnage rapide :          │  │
│                                   │     → Preset recommandé          │  │
│                                   │     OU création manuelle         │  │
│                                   └────────────────┬─────────────────┘  │
│                                                    │                    │
│                                                    ▼                    │
│                                    ┌──────────────────────────────────┐ │
│                                    │    SESSION MULTIJOUEUR           │ │
│                                    │    (rejoint la partie en cours)  │ │
│                                    └───────────────┬──────────────────┘ │
│                                                    │                    │
│                                                    ▼                    │
│                                    ┌──────────────────────────────────┐ │
│                                    │    FIN DE SESSION                │ │
│                                    │    Récompenses stockées          │ │
│                                    └───────────────┬──────────────────┘ │
│                                                    │                    │
│                                                    ▼                    │
│                                    ┌──────────────────────────────────┐ │
│                                    │    /onboarding/profile-setup     │ │
│                                    │    (redirect guard — username     │ │
│                                    │     absent après "profil express")│ │
│                                    │                                  │ │
│                                    │  → Choix du pseudo               │ │
│                                    │  → Compléter méta-perso          │ │
│                                    │  → Redirect Hub (username set)   │ │
│                                    └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Note (P1, refactor)** : Le guard `_authenticated` redirige automatiquement tout utilisateur sans `username` vers `/onboarding/profile-setup`. Dans ce flow P3, l'étape "Profil express" remplace donc le passage par le Hub en état incomplet. Après la complétion du profil (username obligatoire), l'utilisateur atteint le Hub avec un profil complet — aucun bandeau rappel n'est affiché. Le comportement "rejoindre un ami" (F13) sera à préciser lors de l'implémentation P3, en s'appuyant sur ce mécanisme de redirect.

### 2.3 Flow connexion (joueur existant)

```
┌──────────────────────────────────────────────────┐
│            RETOUR JOUEUR EXISTANT                │
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐  │
│  │  Login   │───►│   Hub    │───►│ Reprendre  │  │
│  │          │    │          │    │ ou Nouveau │  │
│  └──────────┘    └──────────┘    └────────────┘  │
│                                                  │
│  Si aventure en cours :                          │
│  → Notification dans le Hub "Aventure en pause"  │
│  → Accès direct en 1 clic                        │
└──────────────────────────────────────────────────┘
```

### 2.4 Flow mot de passe oublié

```
Login → "Mot de passe oublié ?" → Saisie email → Confirmation envoi
    → Email reçu → Lien reset → Nouveau mot de passe → Confirmation → Login
```

### 2.5 Flow multijoueur — Lancement et accès (P3, anticipation UX)

> **Note :** Le multijoueur est P3 dans la roadmap. Cette section anticipe les implications UX pour que l'architecture de l'information et les flows restent cohérents lors de l'implémentation future. Les questions ouvertes sont signalées pour le PM.

#### 2.5.1 Créer une partie multijoueur

```
Hub → Nouvelle aventure → [Multijoueur]
                              │
                              ▼
               ┌────────────────────────────────────┐
               │  CONFIG MULTI                      │
               │                                    │
               │  1. Paramètres aventure            │
               │     (identique au solo :           │
               │     thème, durée, difficulté,      │
               │     template ou aléatoire)         │
               │                                    │
               │  2. Paramètres multijoueur :       │
               │     - Nombre de joueurs max        │
               │     - Visibilité : Privée / Public │
               │     - [Optionnel] Mot de passe     │
               │                                    │
               │  3. Création personnage            │
               │     d'aventure (créateur)          │
               └───────────────┬────────────────────┘
                               │
                               ▼
               ┌───────────────────────────────────┐
               │  SALLE D'ATTENTE                  │
               │                                   │
               │  Joueurs connectés : 1/4          │
               │  Code d'invitation : ABCD-1234    │
               │  [Copier le lien]                 │
               │  [Partager]                       │
               │                                   │
               │  ┌────┐ ┌────┐ ┌────┐ ┌────┐      │
               │  │ ✓  │ │ ?  │ │ ?  │ │ ?  │      │
               │  │Toi │ │    │ │    │ │    │      │
               │  └────┘ └────┘ └────┘ └────┘      │
               │                                   │
               │  [LANCER L'AVENTURE]              │
               │  (actif quand ≥ 2 joueurs)        │
               └───────────────┬───────────────────┘
                               │
                               ▼
                        SESSION DE JEU
```

#### 2.5.2 Rejoindre une partie — Via code d'invitation

```
┌───────────────────────────────────────────────────┐
│  REJOINDRE VIA CODE                               │
│                                                   │
│  Accès depuis :                                   │
│  - Hub → "Rejoindre une partie" → Saisir code     │
│  - OU lien direct (URL avec code intégré)         │
│  - OU lien partagé (réseaux sociaux, messagerie)  │
│                                                   │
│  ┌────────────────────────────────┐               │
│  │  Code : [________]  [Rejoindre]│               │
│  └────────────────────────────────┘               │
│                       │                           │
│                       ▼                           │
│            ┌──────────────────────┐               │
│            │ Création personnage  │               │
│            │ rapide (preset       │               │
│            │ recommandé)          │               │
│            └──────────┬───────────┘               │
│                       │                           │
│                       ▼                           │
│              Salle d'attente                      │
│              (en tant que joueur rejoint)         │
└───────────────────────────────────────────────────┘
```

#### 2.5.3 Rejoindre une partie — Via lobby public

```
┌──────────────────────────────────────────────────────────┐
│  LOBBY PUBLIC                                            │
│                                                          │
│  Accès depuis : Hub → "Rejoindre une partie" → Lobby     │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Filtres : [Thème ▼] [Durée ▼] [Places dispo ▼]     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  🗡️ "Les Mines de Karak"                            │ │
│  │  Thème : Heroic fantasy — Durée : Moyenne           │ │
│  │  Joueurs : 2/4 — Créée par : Aldric                 │ │
│  │  Difficulté : Équilibrée                            │ │
│  │                                       [REJOINDRE]   │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │  🌑 "L'Ombre du Néant"                              │ │
│  │  Thème : Dark fantasy — Durée : Longue              │ │
│  │  Joueurs : 1/3 — Créée par : Morrigan               │ │
│  │  Difficulté : Difficile                             │ │
│  │                                       [REJOINDRE]   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  [Rafraîchir]                    Page 1/3 [< >]          │
└──────────────────────────────────────────────────────────┘
```

#### 2.5.4 Questions ouvertes pour le PM

> Les points ci-dessous impactent directement le design UX du multijoueur et doivent être tranchés avant la Phase 2 des wireframes multijoueur.

| #   | Question                                                                               | Options identifiées                                                                                                                                  | Impact UX                                                                                                     |
| --- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Q1  | **Modèle d'accès multijoueur** : Code d'invitation uniquement, ou lobby public aussi ? | A) Invitation seule — pas de lobby, plus simple, plus privé / B) Le créateur choisit privé (code) ou public (lobby) — plus social, plus discoverable | A = pas de lobby à concevoir. B = lobby + filtres + liste de parties + toggle visibilité dans la config multi |
| Q3  | **Taille max du groupe**                                                               | À définir (2-4 ? 2-6 ?)                                                                                                                              | Impacte le design de la salle d'attente et l'interface de session (affichage joueurs)                         |
| Q4  | **Peut-on rejoindre une partie déjà commencée ?**                                      | A) Non (salle d'attente obligatoire) / B) Oui (hot-join)                                                                                             | B = complexité UX significative (rattraper le contexte narratif, créer un perso en cours de route)            |
| Q5  | **Sync vs Async**                                                                      | A) Temps réel uniquement / B) Mode asynchrone (tour par tour)                                                                                        | B = design radicalement différent, notifications, file d'attente d'actions                                    |
| Q6  | **Interaction entre joueurs**                                                          | A) Chacun agit individuellement, le MJ synthétise / B) Chat entre joueurs + actions / C) Vote collectif sur les choix                                | Impacte le layout de la session de jeu (chat panel, votes, etc.)                                              |

### 2.6 Structure narrative : Milestones & Events

> **Origine :** Concept issu de la phase de discovery initiale (brainstorming fondateurs). Structure la durée et le déroulement des aventures.

**Hiérarchie narrative :**

```
AVENTURE
│
├── 🏴 MILESTONE — Jalon narratif obligatoire (sauf exceptions)
│   │               Structure l'aventure et en prédit la durée.
│   │               Ex : Réception de la quête, Complétion du donjon
│   │
│   ├── ○ EVENT — Rencontre/situation entre milestones (optionnel ou obligatoire)
│   │              Le MJ guide, mais les choix du joueur peuvent contourner
│   │              certains events. Ex : visite d'échoppes, grotte secondaire
│   │
│   └── (Scènes) — Séquence cohérente d'échanges MJ-joueur au sein d'un event
│                   avec un début et une fin naturels. Ex : discuter avec un PNJ.
│                   Les échanges individuels ne sont pas nommés.
```

**Exemple concret :**

```
AVENTURE "La Crypte des Ombres"
│
├── 🏴 MILESTONE 1 — Réception de la quête
│   ├── ○ Arrivée à la taverne (obligatoire — intro)
│   ├── ○ Rencontre avec le marchand (optionnel)
│   └── ○ Discussion avec l'informateur (optionnel)
│
├── 🏴 MILESTONE 2 — Entrée dans la crypte
│   ├── ○ Exploration de la grotte (optionnel)
│   ├── ○ Piège dans le couloir (optionnel)
│   └── ○ Découverte de la salle principale (obligatoire)
│
├── 🏴 MILESTONE 3 — Confrontation finale
│   ├── ○ Négociation avec le gardien (optionnel)
│   └── ○ Combat final (obligatoire)
│
└── 🏴 MILESTONE 4 — Résolution
    └── ○ Retour et récompenses (obligatoire)
```

**Priorisation :**

| Concept        | Priorité     | Justification                                                                   |
| -------------- | ------------ | ------------------------------------------------------------------------------- |
| **Milestones** | **P1**       | Fondamental pour structurer les aventures du MJ IA et gérer la durée dès le MVP |
| **Events**     | **P2 ou P3** | Structuration plus fine entre milestones — à valider avec le PM                 |

**Règle de visibilité UX :** Le nom du milestone en cours peut être affiché (ex : "Réception de la quête" dans l'historique), mais **jamais de progression numérique** (pas de "2/4" ni "50%"). L'estimation de complétion basée sur les milestones, via une barre de progression par exemple, peut être une feature long terme.

**Impact UX :**

| Écran                       | Impact                                                                     | Phase |
| --------------------------- | -------------------------------------------------------------------------- | ----- |
| **E10 — Historique drawer** | Regroupement par milestones (P1), puis par events (P2+)                    | P1    |
| **E8 — Hub**                | Carte aventure en cours affiche le nom du milestone actuel                 | P1    |
| **E9 — Lancement aventure** | Durée estimée corrélée au nombre de milestones (courte = 2-3, longue = 6+) | P1    |
| **E11 — Écran de fin**      | Récap par milestones atteints (P1), events découverts (P2+)                | P1    |

> **Action PM :** Ce concept doit être intégré au PRD (`docs/prd.md`) dans les sections Concepts Clés (§3) et Fonctionnalités (§4).

---

## 3. Architecture de l'information

### 3.1 Arborescence des écrans

```
app.jdrai.com/
│
├── /auth
│   ├── /login                          ← Connexion
│   ├── /register                       ← Inscription
│   ├── /forgot-password                ← Demande de réinitialisation MDP
│   └── /reset-password/:token          ← Formulaire nouveau MDP
│
├── /onboarding
│   ├── /welcome                        ← Bienvenue + explication
│   ├── /profile-setup                  ← Création pseudo + bases
│   └── /tutorial                       ← Aventure tutoriel (= session de jeu guidée)
│
├── /hub                                ← Page principale (après auth)
│   ├── Section méta-personnage         ← Résumé profil, niveau, avatar
│   ├── Section aventures               ← En cours + historique
│   └── Actions : Nouvelle aventure, Rejoindre une partie, Reprendre, Voir profil
│
├── /profile                            ← Détail méta-personnage
│   ├── Identité                        ← Nom, avatar, origine
│   ├── Progression                     ← Niveau, XP, succès
│   └── Cosmétiques                     ← Titres, badges, éléments visuels
│
├── /adventure
│   ├── /new                            ← Lancement nouvelle aventure
│   │   ├── Étape 0 : Choix du mode (Solo / Multijoueur)
│   │   ├── Étape 1 : Paramètres (thème, durée, difficulté) OU template OU aléatoire
│   │   ├── Étape 1bis (multi) : Paramètres multi (nb joueurs, visibilité)
│   │   └── Étape 2 : Création personnage d'aventure
│   ├── /:id                            ← Session de jeu active (solo ou multi)
│   ├── /:id/lobby                      ← Salle d'attente multijoueur (P3)
│   └── /:id/summary                    ← Écran de fin / résumé
│
├── /join                               ← Rejoindre une partie (P3)
│   ├── /join/:inviteCode               ← Via code d'invitation / lien partagé
│   └── /join/lobby                     ← Lobby public (si activé, voir Q1 ci-dessous)
│
└── /settings                           ← Paramètres utilisateur
    ├── Compte                          ← Email, mot de passe, suppression
    ├── Préférences                     ← Thème, compagnon on/off, langue
    └── Notifications                   ← (P3+, préparation multi)
```

> **Q1 - Lobby public :** Voir détails dans la section [§2.5.4 Questions ouvertes pour le PM](#254-questions-ouvertes-pour-le-pm)

### 3.2 Navigation globale

```
┌──────────────────────────────────────────────────────────┐
│  SIDEBAR GAUCHE (persistante après auth)                 │
│                                                          │
│  ┌─────────────────┐                                     │
│  │  JDRAI (logo)   │                                     │
│  ├─────────────────┤                                     │
│  │  🏠 Hub         │  ← Toujours visible                 │
│  │  👤 Profil      │  ← Méta-personnage                  │
│  │  ⚔️ Aventure    │  ← Visible si aventure en cours     │
│  ├─────────────────┤                                     │
│  │  ⚙️ Paramètres  │  ← En bas de sidebar                │
│  │  🚪 Déconnexion │                                     │
│  └─────────────────┘                                     │
│                                                          │
│  MOBILE : bottom tab bar (Hub, Profil, Aventure)         │
└──────────────────────────────────────────────────────────┘
```

**Règles de navigation :**

| Contexte                   | Sidebar     | Comportement                                                                                                                                                                                                                                                                   |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth (login/register)      | Masquée     | Plein écran, pas de navigation                                                                                                                                                                                                                                                 |
| Onboarding                 | Masquée     | Flow linéaire, pas de navigation libre                                                                                                                                                                                                                                         |
| Hub                        | Visible     | Navigation complète                                                                                                                                                                                                                                                            |
| Profil                     | Visible     | Retour Hub via sidebar                                                                                                                                                                                                                                                         |
| Nouvelle aventure (config) | Visible     | Retour Hub possible (abandon création)                                                                                                                                                                                                                                         |
| Session de jeu             | **Masquée** | Navigation classique masquée. Bouton de menu intégré à l'UI de jeu (style jeu vidéo, pas burger classique) pour les actions (quitter, sauvegarder, paramètres MJ). Confirmation obligatoire avant toute sortie de session (changement de page, déconnexion, fermeture onglet). |
| Écran de fin               | Visible     | Retour Hub automatique proposé                                                                                                                                                                                                                                                 |

### 3.3 Hiérarchie du Hub (écran central)

```
┌───────────────────────────────────────────────────────────────────┐
│  HUB                                                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  SECTION MÉTA-PERSONNAGE (header)                            │ │
│  │  ┌──────┐  Nom du joueur          Niveau X                   │ │
│  │  │Avatar│  Titre actif             ████████░░ XP             │ │
│  │  └──────┘  [Voir profil complet]                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  AVENTURE EN COURS (si applicable)                           │ │
│  │  ┌─────────────────────────────────────────────────┐         │ │
│  │  │ 🔥 "La Crypte des Ombres"        [Voir toutes]  │         │ │
│  │  │                                 (si applicable) │         │ │
│  │  │ Sauvegardée il y a 2h — Chapitre 3              │         │ │
│  │  │                                [REPRENDRE]      │         │ │
│  │  └─────────────────────────────────────────────────┘         │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  ACTIONS                                                     │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │  Nouvelle    │  │  Scénario    │  │  Aventure    │        │ │
│  │  │  aventure    │  │  template    │  │  aléatoire   │        │ │
│  │  │ (paramètres) │  │  (préfait)   │  │  (surprise)  │        │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────┐      │ │
│  │  │  🤝 Rejoindre une partie (P3)                      │      │ │
│  │  │  [Entrer un code]          [Parcourir le lobby]    │      │ │
│  │  └────────────────────────────────────────────────────┘      │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  HISTORIQUE (aventures terminées)                            │ │
│  │                                                              │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                         │ │
│  │  │ Avent│ │ Avent│ │ Avent│ │ Avent│  ← Grille scrollable    │ │
│  │  │ ure 1│ │ ure 2│ │ ure 3│ │ ure 4│                         │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

---

## 4. Inventaire des écrans

### 4.1 Écrans P1 (MVP)

| #   | Écran                       | Route                         | Priorité | Maquette existante                                      | Complexité      |
| --- | --------------------------- | ----------------------------- | -------- | ------------------------------------------------------- | --------------- |
| E1  | Login                       | `/auth/login`                 | P1       | `auth.png` (gauche) — adapter                           | Faible          |
| E2  | Register                    | `/auth/register`              | P1       | `auth.png` (droite) — adapter                           | Faible          |
| E3  | Forgot password (demande)   | `/auth/forgot-password`       | P1       | Non                                                     | Faible          |
| E4  | Reset password (formulaire) | `/auth/reset-password/:token` | P1       | Non                                                     | Faible          |
| E5  | Onboarding — Bienvenue      | `/onboarding/welcome`         | P1       | Non — **à concevoir**                                   | Moyenne         |
| E6  | Onboarding — Setup profil   | `/onboarding/profile-setup`   | P1       | Non — **à concevoir**                                   | Moyenne         |
| E7  | Onboarding — Tutoriel       | `/onboarding/tutorial`        | P1       | Non — **à concevoir** (= E10 en mode guidé)             | Élevée          |
| E8  | Hub                         | `/hub`                        | P1       | `list_chara.png` — inspiration libre, **à reconcevoir** | Élevée          |
| E9  | Lancement aventure          | `/adventure/new`              | P1       | Non — **à concevoir**                                   | Moyenne         |
| E10 | Session de jeu              | `/adventure/:id`              | P1       | Non — **à concevoir**                                   | **Très élevée** |
| E11 | Écran de fin                | `/adventure/:id/summary`      | P1       | Non — **à concevoir**                                   | Moyenne         |
| E12 | Sauvegarde/reprise          | (intégré au Hub E8)           | P1       | Non — intégré au Hub                                    | Faible          |

### 4.2 Écrans P2

| #   | Écran                        | Route                       | Maquette existante                                        | Complexité |
| --- | ---------------------------- | --------------------------- | --------------------------------------------------------- | ---------- |
| E13 | Profil méta-personnage       | `/profile`                  | `detail_chara.png` — inspiration libre, **à reconcevoir** | Moyenne    |
| E14 | Création personnage aventure | `/adventure/new` (étape 2)  | `create_chara.png` — inspiration libre, **à reconcevoir** | Moyenne    |
| E15 | Paramètres MJ                | (modal ou panneau dans E10) | Non                                                       | Moyenne    |
| E16 | Paramètres utilisateur       | `/settings`                 | Non — **à concevoir**                                     | Faible     |

> **Note sur E15 — Paramètres MJ en session :**
> L'accès aux paramètres MJ sera possible **pendant** une session active (panneau latéral ou drawer), évitant au joueur de quitter et relancer une aventure. Cependant, les paramètres seront divisés en deux catégories :
>
> | Catégorie                  | Modifiable en session | Exemples                                                                                            |
> | -------------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
> | **Ajustements légers**     | Oui                   | Ton (+ ou - humoristique), niveau de détail narratif (concis ↔ descriptif), longueur des réponses   |
> | **Paramètres structurels** | Non (verrouillés)     | Difficulté, rigueur des règles — car ils impactent la cohérence narrative et l'équilibrage en cours |
>
> Les paramètres verrouillés afficheront un tooltip explicatif : _"Ce paramètre ne peut être modifié qu'au lancement d'une nouvelle aventure pour préserver la cohérence de votre session."_

### 4.3 Écrans à concevoir (priorité)

Par ordre de complexité et d'impact :

1. **E10 — Session de jeu** : coeur du produit, 90% du temps utilisateur
2. **E8 — Hub** : point d'entrée central, première impression post-onboarding
3. **E5/E6/E7 — Onboarding** : première expérience, détermine la rétention
4. **E9 — Lancement aventure** : configuration, doit être rapide et clair
5. **E11 — Écran de fin** : gratification, boucle de rétention

---

## 5. Inventaire des composants UI

### 5.1 Composants globaux

| Composant                | Usage                                                                                         | Écrans                                          |
| ------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Sidebar**              | Navigation principale                                                                         | Tous (sauf auth, onboarding)                    |
| **Bottom Tab Bar**       | Navigation mobile                                                                             | Tous (sauf auth, onboarding)                    |
| **Logo JDRAI**           | Identité visuelle                                                                             | Tous                                            |
| **Avatar utilisateur**   | Méta-personnage                                                                               | Sidebar, Hub, Profil                            |
| **Bouton primaire**      | Action principale (parchemin + or)                                                            | Tous                                            |
| **Bouton secondaire**    | Action secondaire                                                                             | Tous                                            |
| **Bouton fantôme**       | Action tertiaire / navigation                                                                 | Tous                                            |
| **Carte (Card)**         | Conteneur générique                                                                           | Hub, Historique, Listes                         |
| **Modale**               | Confirmations, paramètres                                                                     | Divers                                          |
| **Toast / Notification** | Feedback système                                                                              | Tous                                            |
| **Bandeau info**         | Rappel email non vérifié (dismissable par session)                                            | Hub                                             |
| **Loader / Skeleton**    | Chargement                                                                                    | Tous                                            |
| **Barre de progression** | XP, avancement                                                                                | Hub, Profil, Onboarding                         |
| **CompanionMessage**     | Bulle de dialogue du compagnon méta (voir [§7.2](#72-compagnon-méta--mascotte-de-linterface)) | Hub, Loading, Erreurs, Onboarding, Empty states |

### 5.2 Composants Auth

| Composant          | Description                                 |
| ------------------ | ------------------------------------------- |
| **AuthCard**       | Carte parchemin centré avec formulaire      |
| **Input texte**    | Champ avec label flottant, style fantasy    |
| **Input password** | Avec toggle visibilité                      |
| **Lien inline**    | "Mot de passe oublié ?", "Déjà un compte ?" |
| **Séparateur**     | Ligne décorative entre sections             |

### 5.3 Composants Onboarding

| Composant          | Description                                            |
| ------------------ | ------------------------------------------------------ |
| **StepIndicator**  | Indicateur d'étape (dots ou barre)                     |
| **WelcomeHero**    | Illustration + texte d'accueil immersif                |
| **PresetSelector** | Grille de choix visuels (race, classe)                 |
| **NarrativeBox**   | Zone de texte narratif du MJ (transition vers session) |
| **SkipButton**     | Action de skip non-intrusive mais visible              |

### 5.4 Composants Hub

| Composant               | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| **MetaCharacterBanner** | Résumé méta-perso (avatar, nom, niveau, XP)               |
| **AdventureCard**       | Carte aventure (illustration, titre, statut, date)        |
| **AdventureCardActive** | Variante avec badge "En cours" et bouton Reprendre        |
| **ActionCard**          | Grande carte CTA (Nouvelle aventure, Template, Aléatoire) |
| **AdventureGrid**       | Grille responsive de cartes aventure                      |
| **EmptyState**          | État vide avec CTA ("Lancez votre première aventure !")   |

### 5.5 Composants Session de jeu (E10 — le plus critique)

| Composant             | Description                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NarrationPanel**    | Zone principale : texte narratif du MJ, scrollable, style parchemin                                                                                                           |
| **ChoiceList**        | Liste de 2-4 choix d'action cliquables                                                                                                                                        |
| **ChoiceButton**      | Bouton de choix individuel (numéroté, hover distinctif)                                                                                                                       |
| **FreeInput**         | Zone de saisie texte libre ("OU tapez votre action...")                                                                                                                       |
| **CharacterPanel**    | Panneau latéral : résumé personnage d'aventure (stats, inventaire)                                                                                                            |
| **DiceResult**        | Affichage résultat de dé (si mécaniques visibles)                                                                                                                             |
| **StreamingText**     | Texte qui apparaît progressivement (streaming LLM)                                                                                                                            |
| **SessionHeader**     | Titre aventure + boutons (quitter, sauvegarder, paramètres MJ)                                                                                                                |
| **AutosaveIndicator** | Indicateur discret de sauvegarde ("Sauvegardé ✓")                                                                                                                             |
| **LoadingNarration**  | Indicateur que le MJ réfléchit (animation thématique)                                                                                                                         |
| **HistoryDrawer**     | Drawer plein écran (mobile) / panneau latéral (desktop) affichant l'historique de l'aventure, groupé par milestones (cf. [§2.6](#26-structure-narrative--milestones--events)) |
| **MilestoneHeader**   | En-tête de regroupement dans l'historique : nom du milestone + marqueur "en cours" si applicable                                                                              |

### 5.6 Composants Lancement aventure

| Composant            | Description                                       |
| -------------------- | ------------------------------------------------- |
| **ParamSelector**    | Sélecteur visuel pour thème/durée/difficulté      |
| **ThemeCard**        | Carte thème avec illustration + description       |
| **DifficultySlider** | Slider visuel (indulgent → impitoyable)           |
| **DurationSelector** | Choix courte/moyenne/longue avec estimation temps |
| **TemplateCard**     | Carte scénario pré-fait                           |
| **RandomButton**     | CTA "Surprise !" pour génération aléatoire        |

### 5.7 Composants Écran de fin

| Composant           | Description                                             |
| ------------------- | ------------------------------------------------------- |
| **SummaryCard**     | Résumé narratif de l'aventure                           |
| **RewardList**      | Liste de récompenses obtenues (XP, succès, cosmétiques) |
| **XPGainAnimation** | Animation de gain d'XP sur la barre de progression      |
| **ReturnToHubCTA**  | Bouton retour au Hub                                    |

---

## 6. États et edge cases

### 6.1 Matrice des états par écran

| Écran                      | Default                      | Loading                                  | Empty                             | Error                                                 | Success                                                          |
| -------------------------- | ---------------------------- | ---------------------------------------- | --------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| **Login**                  | Formulaire vide              | Spinner sur bouton                       | —                                 | Message erreur inline (identifiants incorrects)       | Redirect vers Hub (exception : pseudo absent → Onboarding E6-01) |
| **Register**               | Formulaire vide              | Spinner sur bouton                       | —                                 | Erreurs validation inline                             | Redirect vers Onboarding                                         |
| **Hub**                    | Méta-perso + aventures       | Skeletons cards + compagnon              | Compagnon : empty state engageant | Toast erreur + compagnon contextuel                   | —                                                                |
| **Hub (profil incomplet)** | *(non applicable P1)* — Un utilisateur sans `username` est redirigé vers `/onboarding/profile-setup` avant d'atteindre le Hub | — | — | — | — |
| **Session de jeu**         | Narration + choix            | Compagnon : message d'attente thématique | —                                 | Compagnon : message d'erreur avec humour + retry auto | Action traitée, nouvelle narration                               |
| **Lancement aventure**     | Formulaire paramètres        | Spinner + compagnon contextuel           | —                                 | Compagnon : message d'erreur + retry                  | Redirect vers session                                            |
| **Écran de fin**           | Résumé + récompenses         | Skeleton résumé                          | —                                 | Toast erreur                                          | Compagnon : félicitations personnalisées                         |

### 6.2 Edge cases critiques

| Situation                           | Comportement attendu                                                                                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Perte de connexion en jeu**       | Message non-bloquant "Connexion perdue", auto-reconnexion, reprise depuis dernier état sauvegardé                                                                      |
| **LLM timeout / erreur**            | "Le MJ a besoin d'un moment..." → retry automatique (x3) → puis message "Problème technique, réessayez" avec bouton retry                                              |
| **Refresh page en jeu**             | Auto-save assure la reprise au dernier état. Pas de perte de progression.                                                                                              |
| **Session expirée**                 | Redirect login avec message "Session expirée". Après reconnexion, retour à l'écran précédent. (Auth via cookies httpOnly Better Auth)                                  |
| **Onboarding abandonné**            | L'utilisateur peut quitter à tout moment. Au retour → redirect automatique vers `/onboarding/profile-setup` via le guard `_authenticated` (si `username` absent). Le Hub n'est pas accessible tant que le profil est incomplet. |
| **Double onglet sur même aventure** | Détecter et avertir : "Cette aventure est ouverte dans un autre onglet"                                                                                                |
| **Texte libre inapproprié**         | Le MJ IA redirige avec diplomatie ("Votre personnage ne ferait pas cela...") — côté LLM prompt                                                                         |
| **Aventure bloquée (boucle IA)**    | Bouton "Le MJ semble perdu" → relance du contexte / options de secours                                                                                                 |
| **Rate limiting (HTTP 429)**        | Compagnon : "Du calme, aventurier ! Le MJ a besoin de reprendre son souffle." Désactiver temporairement le bouton d'envoi, réactiver après le délai. Compteur visible. |

---

## 7. Recommandations UX

### 7.1 Principes directeurs

1. **Immersion progressive** : L'interface doit s'effacer pendant le jeu. Minimal UI en session, riche UI dans le Hub.
2. **Zéro friction pour Le Curieux** : Chaque écran doit être compréhensible sans connaissance JDR. Pas de jargon non expliqué.
3. **Feedback constant** : Le joueur doit toujours savoir ce qui se passe (auto-save, MJ qui réfléchit, streaming texte).
4. **Mobile-first pour la session de jeu** : L'interaction chat/choix se prête naturellement au mobile. Concevoir d'abord pour mobile.
5. **Gratification visible** : Chaque fin d'aventure doit donner un sentiment d'accomplissement (animations, récompenses, résumé).
6. **Progression narrative, pas numérique** : Les milestones structurent l'aventure mais le joueur ne voit jamais de progression chiffrée (pas de "2/4" ni "%"). Seul le nom du milestone en cours est affiché dans l'historique. L'aventure reste une expérience narrative, pas un tableau de bord.

### 7.2 Compagnon méta — Mascotte de l'interface

**Concept :** Un personnage récurrent qui intervient **en dehors du jeu** (Hub, loading, erreurs, onboarding, succès) pour guider, commenter et divertir le joueur. Il ne remplace pas le MJ IA (qui reste le narrateur en session), mais agit comme un **compagnon de l'interface** — un fil conducteur humoristique qui humanise les moments techniques.

**Inspirations :**

- **Wheatley (Portal 2)** : guide sarcastique, brise le 4e mur, commente les situations avec humour noir
- **Navi (Zelda)** : compagnon utile mais avec une personnalité propre
- **Le Narrateur (Stanley Parable)** : commentaires méta sur les choix du joueur

**Pistes de personnage :**

| Option                    | Description                                                                                                                       | Ton                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Le Scribe**             | Un petit personnage encapuchonné qui "écrit" les aventures du joueur. Commente depuis son bureau encombré de parchemins.          | Sarcastique, lettré, légèrement las   |
| **L'Artefact**            | Un objet magique sentient (grimoire, boule de cristal, dé géant). S'adresse au joueur comme s'il était prisonnier de l'interface. | Dramatique, théâtral, auto-dérision   |
| **Le Gobelin de service** | Un petit gobelin "employé" de la plateforme. Fait tourner les rouages, s'excuse quand ça plante.                                  | Maladroit, attachant, humour physique |

> **Note :** Le choix du personnage sera affiné en Phase 2 (wireframes). L'important ici est de valider le **principe** d'un compagnon méta récurrent.

**Interventions types :**

| Moment                       | Exemple d'intervention                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loading LLM**              | _"Le MJ fouille ses notes... il est un peu désorganisé."_                                                                                                               |
| **Erreur / timeout**         | _"Quelqu'un a renversé de l'encre sur le parchemin. On nettoie."_                                                                                                       |
| **Onboarding**               | _"Bienvenue, aventurier ! Je serai votre guide... enfin, j'essaierai."_                                                                                                 |
| **Première aventure lancée** | _"C'est parti ! ...Ne me regardez pas comme ça, c'est VOUS le héros."_                                                                                                  |
| **Succès / récompense**      | _"Pas mal ! J'ai noté ça dans vos annales. Oui, vous avez des annales maintenant."_                                                                                     |
| **Hub vide (empty state)**   | _"C'est trop calme... J'aime pas trop beaucoup ça... Et si on partait à l'aventure ?"_ Référence à Jamel Debbouze. Évaluer la pertinence de l'intégration de références |
| **Session expirée**          | _"Vous vous êtes endormi à la taverne. Reconnectez-vous pour reprendre."_                                                                                               |
| **Double onglet**            | _"Je ne peux pas être à deux endroits à la fois ! Choisissez un onglet."_                                                                                               |
| **Retour après absence**     | _"Tiens, vous revoilà ! Votre aventure vous attend, chapitre 3."_                                                                                                       |

**Règles de design du compagnon :**

- **Jamais pendant le jeu** : en session, c'est le MJ IA qui parle. Le compagnon n'intervient pas pour ne pas briser l'immersion narrative.
- **Jamais bloquant** : ses messages sont décoratifs/informatifs, jamais des modales qui exigent une action.
- **Fréquence maîtrisée** : pas à chaque action. Il intervient sur les moments clés (transitions, attentes, erreurs, premiers usages).
- **Désactivable** : option dans les paramètres pour les joueurs qui préfèrent une interface sobre.
- **Évolutif** : ses répliques peuvent évoluer avec le niveau du méta-personnage (plus familier au fil du temps).

### 7.3 Points de vigilance

| Point                         | Risque                                     | Recommandation                                                                                                                             |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Temps de réponse LLM**      | Frustration si > 5s                        | Animation thématique engageante ("Le MJ consulte ses parchemins..."), streaming du texte                                                   |
| **Complexité création perso** | Abandon si trop de choix                   | Presets "1 clic" + personnalisation optionnelle. En onboarding : création contextuelle intégrée à l'aventure                               |
| **Méta-personnage confus**    | Utilisateur ne comprend pas la distinction | Ne jamais présenter les deux concepts en même temps. Le tutoriel introduit naturellement le méta-perso comme "votre identité d'aventurier" |
| **Onboarding trop long**      | Drop-off                                   | Viser < 5 min avant la première action de jeu. Le tutoriel EST le jeu, pas une intro avant le jeu.                                         |
| **Hub vide au début**         | Première impression fade                   | Empty state engageant avec illustration et CTA fort                                                                                        |

### 7.4 Accessibilité (WCAG 2.1 AA minimum)

- Contraste suffisant malgré le thème sombre (ratio ≥ 4.5:1 pour le texte)
- Navigation clavier complète (focus visible sur tous les interactifs)
- Labels ARIA pour les composants custom (sidebar, choix de jeu, sliders)
- Texte redimensionnable sans perte de fonctionnalité
- Réduction de mouvement respectée (`prefers-reduced-motion`)
- Alternatives textuelles pour toutes les illustrations

### 7.5 Responsive

| Breakpoint                | Layout                                                         |
| ------------------------- | -------------------------------------------------------------- |
| **Mobile** (< 768px)      | Bottom tab bar, narration plein écran, choix en bas            |
| **Tablette** (768-1024px) | Sidebar collapsée, layout adaptatif                            |
| **Desktop** (> 1024px)    | Sidebar étendue, layouts split (comme les maquettes actuelles) |

---

## Prochaines étapes

Ce document sert de **fondation** pour :

1. **Phase 2** : Wireframes détaillés de chaque écran listé (section 4) → `docs/ux/wireframes/` (1 fichier par écran, voir `wireframes/README.md`)
2. **Phase 3** : Spécifications front-end et prompts de génération UI
3. **PO** : Rédaction des user stories basées sur les flows et l'inventaire d'écrans
4. **PM** : Intégration du concept Milestones & Events (§2.6) dans le PRD — impacte les Concepts Clés (§3) et Fonctionnalités (§4)

**Priorité de conception UX (wireframes/maquettes) :**

> **Important :** Cet ordre concerne uniquement la conception UX — il détermine dans quel ordre les écrans seront maquettés, en priorisant l'impact sur l'expérience utilisateur et les dépendances de design. L'ordre de **développement** sera défini par l'architecte et le PO lors de la rédaction des user stories.

1. E10 — Session de jeu (coeur produit)
2. E8 — Hub (point d'entrée)
3. E5/E6/E7 — Onboarding (première impression)
4. E9 — Lancement aventure
5. E11 — Écran de fin
6. E1/E2 — Auth (adaptation maquettes existantes)

---

**Document généré via BMAD Method — Phase UX (Sally, UX Expert)**
