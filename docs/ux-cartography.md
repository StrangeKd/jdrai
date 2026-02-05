# JDRAI - Cartographie UX (Phase 1)

**Version :** 1.0
**Date :** 2026-02-05
**Auteur :** Sally (UX Expert, BMAD Method)
**Statut :** Draft
**Référence :** `docs/prd.md` v1.1

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

### 1.2 Maquettes existantes et adaptation

| Maquette           | Usage original      | Adaptation nouvelle version                                                                         |
| ------------------ | ------------------- | --------------------------------------------------------------------------------------------------- |
| `auth.png`         | Login / Register    | **Conservé** — Adapter les champs (ajouter pseudo à l'inscription)                                  |
| `list_chara.png`   | Liste personnages   | **→ Hub principal** — Grille de cartes = aventures (en cours + terminées) + section méta-personnage |
| `create_chara.png` | Création personnage | **→ Création personnage d'aventure** — Stats, race, classe. Réutilisable tel quel (P2)              |
| `detail_chara.png` | Détail personnage   | **→ Détail méta-personnage** — Adapter pour progression, succès, cosmétiques                        |

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
│                   │ 1. Paramètres :   │    │en cours │        │      │   │
│                   │    - Thème        │    └────┬────┘        └──────┘   │
│                   │    - Durée        │         │                        │
│                   │    - Difficulté   │         │                        │
│                   │ OU Template       │         │                        │
│                   │ OU Aléatoire      │         │                        │
│                   │                   │         │                        │
│                   │ 2. Création perso │         │                        │
│                   │    d'aventure     │         │                        │
│                   └────────┬──────────┘         │                        │
│                            │                    │                        │
│                            ▼                    ▼                        │
│                   ┌──────────────────────────────────┐                   │
│                   │       SESSION DE JEU             │                   │
│                   │                                  │                   │
│                   │  Narration MJ IA                 │                   │
│                   │  + Choix suggérés (2-4)          │                   │
│                   │  + Saisie libre                  │                   │
│                   │  + Auto-save continu             │                   │
│                   │                                  │                   │
│                   │  [Quitter] → Sauvegarde auto     │                   │
│                   │  [Fin aventure] → Récompenses    │                   │
│                   └───────────────┬──────────────────┘                   │
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
│                                   │     OU création rapide           │  │
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
│                                    │    HUB (profil incomplet)        │ │
│                                    │                                  │ │
│                                    │  ┌─────────────────────────────┐ │ │
│                                    │  │ Bandeau rappel :            │ │ │
│                                    │  │ "Complétez votre profil     │ │ │
│                                    │  │  pour débloquer vos         │ │ │
│                                    │  │  récompenses !"             │ │ │
│                                    │  └─────────────────────────────┘ │ │
│                                    │                                  │ │
│                                    │  → Faire le tutoriel             │ │
│                                    │  → Compléter méta-perso          │ │
│                                    │  → Continuer sans (fonctionnel)  │ │
│                                    └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

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

---

## 3. Architecture de l'information

### 3.1 Arborescence des écrans

```
app.jdrai.com/
│
├── /auth
│   ├── /login                   ← Connexion
│   ├── /register                ← Inscription
│   └── /reset-password          ← Réinitialisation MDP
│       └── /reset-password/:token   ← Formulaire nouveau MDP
│
├── /onboarding
│   ├── /welcome                 ← Bienvenue + explication
│   ├── /profile-setup           ← Création pseudo + bases
│   └── /tutorial                ← Aventure tutoriel (= session de jeu guidée)
│
├── /hub                         ← Page principale (après auth)
│   ├── Section méta-personnage  ← Résumé profil, niveau, avatar
│   ├── Section aventures        ← En cours + historique
│   └── Actions : Nouvelle aventure, Reprendre, Voir profil
│
├── /profile                     ← Détail méta-personnage
│   ├── Identité                 ← Nom, avatar, origine
│   ├── Progression              ← Niveau, XP, succès
│   └── Cosmétiques              ← Titres, badges, éléments visuels
│
├── /adventure
│   ├── /new                     ← Lancement nouvelle aventure
│   │   ├── Étape 1 : Paramètres (thème, durée, difficulté) OU template OU aléatoire
│   │   └── Étape 2 : Création personnage d'aventure
│   ├── /:id                     ← Session de jeu active
│   └── /:id/summary             ← Écran de fin / résumé
│
└── /join/:inviteCode            ← Rejoindre via invitation (P3, mais route réservée)
```

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

| Contexte                   | Sidebar       | Comportement                                                                                                           |
| -------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Auth (login/register)      | Masquée       | Plein écran, pas de navigation                                                                                         |
| Onboarding                 | Masquée       | Flow linéaire, pas de navigation libre                                                                                 |
| Hub                        | Visible       | Navigation complète                                                                                                    |
| Profil                     | Visible       | Retour Hub via sidebar                                                                                                 |
| Nouvelle aventure (config) | Visible       | Retour Hub possible (abandon création)                                                                                 |
| Session de jeu             | **Minimisée** | Sidebar réduite à icônes pour maximiser l'immersion. Menu hamburger pour actions (quitter, sauvegarder, paramètres MJ) |
| Écran de fin               | Visible       | Retour Hub automatique proposé                                                                                         |

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
│  │  ┌─────────────────────────────────────────────┐             │ │
│  │  │ 🔥 "La Crypte des Ombres"                   │             │ │
│  │  │ Sauvegardée il y a 2h — Chapitre 3          │             │ │
│  │  │                                [REPRENDRE]  │             │ │
│  │  └─────────────────────────────────────────────┘             │ │
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

| #   | Écran                       | Route                         | Priorité | Maquette existante                          | Complexité      |
| --- | --------------------------- | ----------------------------- | -------- | ------------------------------------------- | --------------- |
| E1  | Login                       | `/auth/login`                 | P1       | `auth.png` (gauche) — adapter               | Faible          |
| E2  | Register                    | `/auth/register`              | P1       | `auth.png` (droite) — adapter               | Faible          |
| E3  | Reset password (demande)    | `/auth/reset-password`        | P1       | Non                                         | Faible          |
| E4  | Reset password (formulaire) | `/auth/reset-password/:token` | P1       | Non                                         | Faible          |
| E5  | Onboarding — Bienvenue      | `/onboarding/welcome`         | P1       | Non — **à concevoir**                       | Moyenne         |
| E6  | Onboarding — Setup profil   | `/onboarding/profile-setup`   | P1       | Non — **à concevoir**                       | Moyenne         |
| E7  | Onboarding — Tutoriel       | `/onboarding/tutorial`        | P1       | Non — **à concevoir** (= E10 en mode guidé) | Élevée          |
| E8  | Hub                         | `/hub`                        | P1       | `list_chara.png` — adapter fortement        | Élevée          |
| E9  | Lancement aventure          | `/adventure/new`              | P1       | Non — **à concevoir**                       | Moyenne         |
| E10 | Session de jeu              | `/adventure/:id`              | P1       | Non — **à concevoir**                       | **Très élevée** |
| E11 | Écran de fin                | `/adventure/:id/summary`      | P1       | Non — **à concevoir**                       | Moyenne         |
| E12 | Sauvegarde/reprise          | (intégré au Hub E8)           | P1       | Non — intégré au Hub                        | Faible          |

### 4.2 Écrans P2

| #   | Écran                        | Route                        | Maquette existante           | Complexité |
| --- | ---------------------------- | ---------------------------- | ---------------------------- | ---------- |
| E13 | Profil méta-personnage       | `/profile`                   | `detail_chara.png` — adapter | Moyenne    |
| E14 | Création personnage aventure | `/adventure/new` (étape 2)   | `create_chara.png` — adapter | Moyenne    |
| E15 | Paramètres MJ                | (modale ou panneau dans E10) | Non                          | Moyenne    |

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

| Composant                | Usage                                      | Écrans                       |
| ------------------------ | ------------------------------------------ | ---------------------------- |
| **Sidebar**              | Navigation principale                      | Tous (sauf auth, onboarding) |
| **Bottom Tab Bar**       | Navigation mobile                          | Tous (sauf auth, onboarding) |
| **Logo JDRAI**           | Identité visuelle                          | Tous                         |
| **Avatar utilisateur**   | Méta-personnage                            | Sidebar, Hub, Profil         |
| **Bouton primaire**      | Action principale (parchemin + or)         | Tous                         |
| **Bouton secondaire**    | Action secondaire                          | Tous                         |
| **Bouton fantôme**       | Action tertiaire / navigation              | Tous                         |
| **Carte (Card)**         | Conteneur générique                        | Hub, Historique, Listes      |
| **Modale**               | Confirmations, paramètres                  | Divers                       |
| **Toast / Notification** | Feedback système                           | Tous                         |
| **Bandeau info**         | Rappel profil incomplet, aventure en pause | Hub                          |
| **Loader / Skeleton**    | Chargement                                 | Tous                         |
| **Barre de progression** | XP, avancement                             | Hub, Profil, Onboarding      |

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

| Composant             | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| **NarrationPanel**    | Zone principale : texte narratif du MJ, scrollable, style parchemin |
| **ChoiceList**        | Liste de 2-4 choix d'action cliquables                              |
| **ChoiceButton**      | Bouton de choix individuel (numéroté, hover distinctif)             |
| **FreeInput**         | Zone de saisie texte libre ("OU tapez votre action...")             |
| **CharacterPanel**    | Panneau latéral : résumé personnage d'aventure (stats, inventaire)  |
| **DiceResult**        | Affichage résultat de dé (si mécaniques visibles)                   |
| **StreamingText**     | Texte qui apparaît progressivement (streaming LLM)                  |
| **SessionHeader**     | Titre aventure + boutons (quitter, sauvegarder, paramètres MJ)      |
| **AutosaveIndicator** | Indicateur discret de sauvegarde ("Sauvegardé ✓")                   |
| **LoadingNarration**  | Indicateur que le MJ réfléchit (animation thématique)               |

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

| Écran                      | Default                      | Loading                          | Empty                              | Error                                           | Success                            |
| -------------------------- | ---------------------------- | -------------------------------- | ---------------------------------- | ----------------------------------------------- | ---------------------------------- |
| **Login**                  | Formulaire vide              | Spinner sur bouton               | —                                  | Message erreur inline (identifiants incorrects) | Redirect vers Hub/Onboarding       |
| **Register**               | Formulaire vide              | Spinner sur bouton               | —                                  | Erreurs validation inline                       | Redirect vers Onboarding           |
| **Hub**                    | Méta-perso + aventures       | Skeletons cards                  | "Lancez votre première aventure !" | Toast erreur chargement                         | —                                  |
| **Hub (profil incomplet)** | Bandeau rappel + fonctionnel | Idem                             | Idem                               | Idem                                            | —                                  |
| **Session de jeu**         | Narration + choix            | "Le MJ réfléchit..." (animation) | —                                  | "Connexion perdue, reconnexion..." + retry auto | Action traitée, nouvelle narration |
| **Lancement aventure**     | Formulaire paramètres        | Spinner génération               | —                                  | Erreur génération ("Réessayez")                 | Redirect vers session              |
| **Écran de fin**           | Résumé + récompenses         | Skeleton résumé                  | —                                  | Toast erreur                                    | Récompenses attribuées             |

### 6.2 Edge cases critiques

| Situation                           | Comportement attendu                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Perte de connexion en jeu**       | Message non-bloquant "Connexion perdue", auto-reconnexion, reprise depuis dernier état sauvegardé                         |
| **LLM timeout / erreur**            | "Le MJ a besoin d'un moment..." → retry automatique (x3) → puis message "Problème technique, réessayez" avec bouton retry |
| **Refresh page en jeu**             | Auto-save assure la reprise au dernier état. Pas de perte de progression.                                                 |
| **Session expirée (JWT)**           | Redirect login avec message "Session expirée". Après reconnexion, retour à l'écran précédent.                             |
| **Onboarding abandonné**            | L'utilisateur peut quitter à tout moment. Au retour → Hub avec profil incomplet + rappel.                                 |
| **Double onglet sur même aventure** | Détecter et avertir : "Cette aventure est ouverte dans un autre onglet"                                                   |
| **Texte libre inapproprié**         | Le MJ IA redirige avec diplomatie ("Votre personnage ne ferait pas cela...") — côté LLM prompt                            |
| **Aventure bloquée (boucle IA)**    | Bouton "Le MJ semble perdu" → relance du contexte / options de secours                                                    |

---

## 7. Recommandations UX

### 7.1 Principes directeurs

1. **Immersion progressive** : L'interface doit s'effacer pendant le jeu. Minimal UI en session, riche UI dans le Hub.
2. **Zéro friction pour Le Curieux** : Chaque écran doit être compréhensible sans connaissance JDR. Pas de jargon non expliqué.
3. **Feedback constant** : Le joueur doit toujours savoir ce qui se passe (auto-save, MJ qui réfléchit, streaming texte).
4. **Mobile-first pour la session de jeu** : L'interaction chat/choix se prête naturellement au mobile. Concevoir d'abord pour mobile.
5. **Gratification visible** : Chaque fin d'aventure doit donner un sentiment d'accomplissement (animations, récompenses, résumé).

### 7.2 Points de vigilance

| Point                         | Risque                                     | Recommandation                                                                                                                             |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Temps de réponse LLM**      | Frustration si > 5s                        | Animation thématique engageante ("Le MJ consulte ses parchemins..."), streaming du texte                                                   |
| **Complexité création perso** | Abandon si trop de choix                   | Presets "1 clic" + personnalisation optionnelle. En onboarding : création contextuelle intégrée à l'aventure                               |
| **Méta-personnage confus**    | Utilisateur ne comprend pas la distinction | Ne jamais présenter les deux concepts en même temps. Le tutoriel introduit naturellement le méta-perso comme "votre identité d'aventurier" |
| **Onboarding trop long**      | Drop-off                                   | Viser < 5 min avant la première action de jeu. Le tutoriel EST le jeu, pas une intro avant le jeu.                                         |
| **Hub vide au début**         | Première impression fade                   | Empty state engageant avec illustration et CTA fort                                                                                        |

### 7.3 Accessibilité (WCAG 2.1 AA minimum)

- Contraste suffisant malgré le thème sombre (ratio ≥ 4.5:1 pour le texte)
- Navigation clavier complète (focus visible sur tous les interactifs)
- Labels ARIA pour les composants custom (sidebar, choix de jeu, sliders)
- Texte redimensionnable sans perte de fonctionnalité
- Réduction de mouvement respectée (`prefers-reduced-motion`)
- Alternatives textuelles pour toutes les illustrations

### 7.4 Responsive

| Breakpoint                | Layout                                                         |
| ------------------------- | -------------------------------------------------------------- |
| **Mobile** (< 768px)      | Bottom tab bar, narration plein écran, choix en bas            |
| **Tablette** (768-1024px) | Sidebar collapsée, layout adaptatif                            |
| **Desktop** (> 1024px)    | Sidebar étendue, layouts split (comme les maquettes actuelles) |

---

## Prochaines étapes

Ce document sert de **fondation** pour :

1. **Phase 2** : Wireframes détaillés de chaque écran listé (section 4)
2. **Phase 3** : Spécifications front-end et prompts de génération UI
3. **PO** : Rédaction des user stories basées sur les flows et l'inventaire d'écrans

**Priorité de wireframing recommandée :**

1. E10 — Session de jeu (coeur produit)
2. E8 — Hub (point d'entrée)
3. E5/E6/E7 — Onboarding (première impression)
4. E9 — Lancement aventure
5. E11 — Écran de fin
6. E1/E2 — Auth (adaptation maquettes existantes)

---

**Document généré via BMAD Method — Phase UX (Sally, UX Expert)**
