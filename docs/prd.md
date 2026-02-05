# JDRAI - Product Requirements Document (PRD)

**Version:** 1.1
**Date:** 2026-02-04
**Statut:** Validé par CEO
**Dernière mise à jour:** Stack technique confirmée, onboarding révisé
**Auteur:** PM (BMAD Method)

---

## 1. Vision Produit

### 1.1 Énoncé de vision

> **JDRAI** permet de vivre des aventures RPG personnalisées à tout moment, en solo ou en groupe, avec un MJ IA personnalisable qui propose des expériences uniques à chaque session.

### 1.2 Proposition de valeur

- **Accessibilité** : Jouer au JDR sans besoin d'un MJ humain ni de réunir un groupe
- **Personnalisation** : MJ IA ajustable (ton, difficulté, style narratif, rigueur des règles)
- **Progression** : Système de méta-personnage récompensant l'engagement à travers les aventures
- **Onboarding** : Expérience guidée pour les néophytes du JDR

### 1.3 Problèmes résolus

| Problème                         | Priorité      | Solution JDRAI                              |
| -------------------------------- | ------------- | ------------------------------------------- |
| Absence de MJ disponible         | 🔴 Principal  | MJ IA toujours disponible                   |
| Difficulté à réunir un groupe    | 🟠 Secondaire | Mode solo + multijoueur flexible            |
| Barrière d'entrée pour débutants | 🟠 Secondaire | Tutoriel intégré, presets, onboarding guidé |

---

## 2. Utilisateurs Cibles

### 2.1 Personas

#### Le Curieux

- **Profil** : N'a jamais joué au JDR, curieux de découvrir
- **Besoin** : Expérience guidée, sans friction, pas de prérequis
- **Critère de succès** : Terminer une première aventure en moins de 30 minutes

#### Le Solo

- **Profil** : Joueur de RPG vidéo (Skyrim, Baldur's Gate), cherche du narratif personnalisé
- **Besoin** : Histoires uniques, choix impactants, rejouabilité
- **Critère de succès** : Revenir pour plusieurs aventures, progression méta-personnage

#### Le Groupe Orphelin

- **Profil** : Rôlistes expérimentés sans MJ disponible
- **Besoin** : Jouer ensemble malgré l'absence de MJ humain
- **Critère de succès** : Sessions multijoueur fluides avec MJ IA

### 2.2 Anti-personas (hors cible MVP)

- Rôlistes puristes préférant exclusivement le JDR traditionnel avec MJ humain
- Joueurs cherchant uniquement du contenu compétitif/PvP

---

## 3. Concepts Clés

### 3.1 Le Méta-personnage

Le méta-personnage est le **profil persistant du joueur** à travers toutes ses aventures. Il ne possède pas de stats de combat.

**Composants :**

- **Identité** : Nom, avatar, origine narrative (background)
- **Progression** : Niveau, XP, succès débloqués
- **Cosmétiques** : Titres, tenues, badges, éléments visuels
- **Modificateurs** : Bonus légers optionnels (faible impact gameplay)

**Fonction template** : Le méta-personnage peut servir de base pour créer rapidement un personnage d'aventure (nom, classe préférée, origine).

### 3.2 Le Personnage d'Aventure

Personnage **temporaire** créé pour chaque aventure.

**Composants :**

- Race
- Classe (archétype)
- Background/Origine
- Stats (Force, Agilité, Charisme, Karma, etc.)
- Nom

**Création facilitée :**

- Presets pour débutants
- Liberté totale pour joueurs expérimentés
- Option : partir du template méta-personnage

### 3.3 Structure Hub + Aventures

```
┌─────────────────────────────────────────────────────────────────┐
│  HUB (persistant)                                               │
│  ┌─────────────────┐                                            │
│  │ MÉTA-PERSONNAGE │ ← Profil, progression, cosmétiques         │
│  │    (Profil)     │ ← Sert de template optionnel               │
│  └────────┬────────┘                                            │
│           │                                                     │
│     ┌─────┴─────┬─────────────┐                                 │
│     ▼           ▼             ▼                                 │
│  ┌──────┐   ┌──────┐     ┌──────┐                               │
│  │ Avent│   │ Avent│     │ Avent│  ← Personnages temporaires    │
│  │ ure 1│   │ ure 2│     │ ure 3│  ← Sauvegarde possible        │
│  └──────┘   └──────┘     └──────┘  ← Récompenses → Hub          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Fonctionnalités

### 4.1 Priorisation MVP

| Priorité | Feature                      | Description                                                     |
| -------- | ---------------------------- | --------------------------------------------------------------- |
| **P1**   | Authentification             | Inscription, connexion, gestion de session                      |
| **P1**   | Session solo MJ IA           | Aventure textuelle avec MJ IA (choix hybrides)                  |
| **P1**   | Sauvegarde/Reprise           | Sauvegarder et reprendre une aventure en cours                  |
| **P1**   | Onboarding/Tutoriel          | Parcours guidé pour nouveaux joueurs + création méta-personnage |
| **P2**   | Méta-personnage              | Profil joueur avec progression et cosmétiques                   |
| **P2**   | Personnalisation MJ          | Ajustement basique (ton, difficulté, style)                     |
| **P2**   | Création personnage aventure | Race, classe, background, stats                                 |
| **P3**   | Génération d'images          | Illustrations de scènes et personnages                          |
| **P3**   | Multijoueur                  | Sessions à plusieurs joueurs                                    |
| **P4**   | Narration audio              | Voix synthétisée pour le MJ                                     |
| **P4**   | Genres additionnels          | Dark fantasy, sci-fi, etc.                                      |

### 4.2 Détail des features MVP (P1)

#### F1. Authentification

- Inscription (email + mot de passe)
- Connexion / Déconnexion
- Récupération de mot de passe
- Session persistante (JWT)

#### F2. Session solo MJ IA

- Lancement d'aventure avec paramètres :
  - Thème/ambiance
  - Durée estimée (courte, moyenne, longue)
  - Difficulté
- OU sélection d'un scénario template
- OU génération aléatoire
- Interaction hybride : choix suggérés + texte libre
- Narration textuelle immersive
- Système de règles maison (mécaniques à tester : dés visibles vs cachés)

#### F3. Sauvegarde/Reprise

- Sauvegarde automatique de l'état de l'aventure
- Liste des aventures en cours
- Reprise à tout moment
- Historique des aventures terminées

#### F4. Onboarding/Tutoriel

**Parcours standard :**

- Parcours guidé première connexion
- Création du méta-personnage avec presets de background
- Tutoriel interactif = première aventure solo guidée
- Le personnage créé pour cette aventure devient le méta-personnage

**Parcours "Rejoindre un ami" :**

- Skip du tutoriel possible (invitation reçue)
- Profil minimal créé (nom uniquement)
- Rejoint directement l'aventure multijoueur
- Tutoriel reprendre plus tard depuis le Hub
- Méta-personnage complété ultérieurement
- Récompenses de l'aventure stockées et liées rétroactivement au méta-personnage

**Règles :**

- Tutoriel = fortement encouragé mais jamais bloquant
- Profil "incomplet" = fonctionnel pour jouer
- Rappel non-intrusif pour compléter le profil

### 4.3 Détail des features importantes (P2)

#### F5. Méta-personnage

- Création lors de l'onboarding
- Éléments : nom, avatar, origine/background
- Progression : niveaux, XP gagnée par aventure
- Succès : achievements débloquables
- Cosmétiques : titres, éléments visuels
- Modificateurs légers (optionnel, faible impact)
- Fonction template pour personnages d'aventure

#### F6. Personnalisation MJ

- Ton/personnalité : sérieux, humoristique, épique, sombre
- Difficulté : indulgent → impitoyable
- Rigueur des règles : narratif libre → strict
- Style narratif : concis → descriptif

#### F7. Création personnage aventure

- Choix de race (liste à définir)
- Choix de classe/archétype
- Background/origine (presets ou libre)
- Distribution de points de stats
- Nom (libre ou généré)
- Option : partir du template méta-personnage

---

## 5. Expérience Utilisateur

### 5.1 Parcours utilisateur principal

**Parcours standard (nouveau joueur) :**

```
Inscription → Tutoriel (aventure guidée + création perso = méta-perso)
                                            ↓
                                    Hub (méta-personnage)
                                            ↓
                              ┌─────────────┴─────────────┐
                              ↓                           ↓
                    Nouvelle aventure              Reprendre aventure
                              ↓                           ↓
                    Paramètres + Création         Chargement sauvegarde
                    personnage temporaire
                              ↓                           ↓
                              └─────────────┬─────────────┘
                                            ↓
                                    Session de jeu
                                            ↓
                                    Fin / Sauvegarde
                                            ↓
                                    Récompenses → Hub
```

**Parcours "Rejoindre un ami" :**

```
Inscription → Skip tutoriel → Profil minimal (nom)
                                            ↓
                              Rejoint aventure multijoueur
                                            ↓
                                    Session de jeu
                                            ↓
                              Fin → Récompenses stockées
                                            ↓
                    Hub (profil incomplet, rappel tutoriel)
                                            ↓
                    Compléter tutoriel → Créer méta-perso
                                            ↓
                          Récompenses liées rétroactivement
```

### 5.2 Interaction MJ IA

**Format hybride :**

- Le MJ narre la situation
- Propose 2-4 choix d'actions suggérées
- Le joueur peut choisir une suggestion OU écrire une action libre
- Le MJ réagit et fait avancer l'histoire

**Exemple d'interaction :**

```
╔════════════════════════════════════════════════════════════════╗
║  MJ : Vous pénétrez dans la taverne enfumée. Un silence        ║
║  s'installe à votre arrivée. Le tavernier vous dévisage        ║
║  derrière son comptoir, tandis qu'un groupe de mercenaires     ║
║  dans le coin vous lance des regards hostiles.                 ║
║                                                                ║
║  Que faites-vous ?                                             ║
║                                                                ║
║  [1] M'approcher du comptoir et commander une boisson          ║
║  [2] Ignorer les regards et chercher une table isolée          ║
║  [3] Affronter le regard des mercenaires                       ║
║                                                                ║
║  > OU tapez votre action : _________________________________   ║
╚════════════════════════════════════════════════════════════════╝
```

### 5.3 Maquettes existantes

Les maquettes UX/UI suivantes sont disponibles et validées comme base :

| Écran                             | Fichier                    | Statut                           |
| --------------------------------- | -------------------------- | -------------------------------- |
| Authentification (Login/Register) | `mockups/auth.png`         | ✅ À adapter                     |
| Liste des personnages             | `mockups/list_chara.png`   | ✅ À adapter (→ liste aventures) |
| Création personnage               | `mockups/create_chara.png` | ✅ À adapter                     |
| Détail personnage                 | `mockups/detail_chara.png` | ✅ À adapter                     |

**Écrans à concevoir :**

- Hub (méta-personnage)
- Lancement d'aventure (paramètres)
- Interface de jeu (session MJ IA)
- Onboarding/Tutoriel

---

## 6. Spécifications Techniques

### 6.1 Stack technique

| Couche              | Technologie                                |
| ------------------- | ------------------------------------------ |
| **Monorepo**        | pnpm workspaces ou Turborepo               |
| **Frontend (App)**  | React 18+, Vite, TypeScript                |
| **Routing**         | TanStack Router                            |
| **UI**              | Tailwind CSS, ShadCN/UI                    |
| **Formulaires**     | React Hook Form + Zod                      |
| **State/Data**      | TanStack Query                             |
| **Backend**         | Node.js, Express, TypeScript               |
| **Auth**            | JWT (géré par Express, Passport.js)        |
| **ORM**             | Drizzle + drizzle-zod                      |
| **Base de données** | PostgreSQL                                 |
| **Temps réel**      | Socket.io (pour multijoueur futur)         |
| **LLM**             | Multi-provider (Mammouth AI ou équivalent) |

### 6.2 Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         jdrai.com                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐              ┌─────────────────────────┐  │
│   │    Webflow      │              │     React + Vite        │  │
│   │   (marketing)   │   redirect   │        (app)            │  │
│   │                 │ ──────────►  │                         │  │
│   │  jdrai.com      │              │  app.jdrai.com          │  │
│   │  /features      │              │  /auth/*                │  │
│   │  /pricing       │              │  /hub                   │  │
│   │  /blog          │              │  /adventure/*           │  │
│   └─────────────────┘              └───────────┬─────────────┘  │
│                                                │                │
│   Hors scope technique                         ▼                │
│   (géré par UX/UI)                 ┌─────────────────────────┐  │
│                                    │       Express           │  │
│                                    │        (api)            │  │
│                                    │                         │  │
│                                    │  api.jdrai.com          │  │
│                                    └─────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Structure monorepo

```
jdrai/
├── apps/
│   ├── web/              # React + Vite (SPA)
│   └── api/              # Express backend
├── packages/
│   └── shared/           # Schémas Zod, types, utils partagés
├── docs/                 # Documentation BMAD
├── mockups/              # Maquettes UX/UI
└── package.json          # Workspace root
```

### 6.4 Pages marketing (hors scope technique)

Les pages marketing (landing, features, pricing, blog) seront gérées via **Webflow** :

- Hébergées sur `jdrai.com`
- Gérées par l'équipe UX/UI indépendamment du développement
- Redirection vers `app.jdrai.com` pour l'application
- SEO optimisé nativement

**Avantages :**

- Itérations marketing indépendantes du code
- L'équipe UX/UI peut modifier sans développeur
- Pas de maintenance technique côté dev

### 6.5 Intégration LLM

- Architecture multi-provider pour flexibilité
- Abstraction permettant de changer de provider sans impact code métier
- Streaming des réponses (texte progressif)
- Gestion des tokens/coûts
- Fallback en cas d'indisponibilité d'un provider

### 6.6 Temps réel (préparation multijoueur)

- Socket.io intégré côté Express
- Prévu pour le mode multijoueur (P3)
- Utilisable aussi pour le streaming LLM si nécessaire

---

## 7. Modèle Économique

**Statut :** À définir

**Objectif :** Rentabilité minimum (couvrir les coûts d'infrastructure)

**Options à explorer :**

- Freemium (features avancées payantes)
- Abonnement
- Pay-per-play (crédits)
- Combinaison

**Coûts à couvrir :**

- Infrastructure (hébergement, BDD)
- Appels API LLM (coût principal)
- Génération d'images (si activée)
- Synthèse vocale (post-MVP)

---

## 8. Roadmap

### Phase 1 : MVP (P1 + P2 partiels)

- Authentification complète
- Onboarding + création méta-personnage
- Session solo MJ IA (texte, one-shot)
- Sauvegarde/reprise
- Personnalisation MJ basique

### Phase 2 : Enrichissement

- Méta-personnage complet (progression, succès, cosmétiques)
- Création personnage aventure enrichie
- Génération d'images

### Phase 3 : Social

- Mode multijoueur
- Partage d'aventures

### Phase 4 : Extension

- Narration audio
- Genres additionnels (dark fantasy, sci-fi)
- Mode campagne (aventures longues)

---

## 9. Métriques de Succès

| Métrique                             | Cible MVP   |
| ------------------------------------ | ----------- |
| Taux de complétion onboarding        | > 80%       |
| Taux de complétion première aventure | > 60%       |
| Rétention J+7                        | > 30%       |
| Aventures par utilisateur actif      | > 2/semaine |

---

## 10. Risques et Hypothèses

### Hypothèses

- Les utilisateurs accepteront un MJ IA comme alternative au MJ humain
- L'interaction hybride (choix + texte libre) satisfait différents profils
- Le système de méta-progression encourage la rétention

### Risques

| Risque                             | Impact   | Mitigation                               |
| ---------------------------------- | -------- | ---------------------------------------- |
| Qualité narrative LLM insuffisante | 🔴 Élevé | Tests multi-providers, prompts optimisés |
| Coûts LLM trop élevés              | 🔴 Élevé | Monitoring, limites, modèle éco adapté   |
| Onboarding trop complexe           | 🟠 Moyen | Tests utilisateurs, itérations           |
| Manque de rejouabilité             | 🟠 Moyen | Variété scénarios, personnalisation      |

---

## 11. Questions Ouvertes

### Gameplay

1. **Mécaniques de dés** : Dés visibles vs calculs cachés — à tester avec utilisateurs
2. **Progression in-aventure** : XP/niveaux vs milestones narratifs — à définir
3. **Taille max groupe multijoueur** : À définir selon retours
4. **Sync vs Async multijoueur** : À définir selon retours
5. **Système de règles détaillé** : À concevoir (races, classes, stats, équilibrage)

### Contraintes techniques à résoudre (Phase Architecture)

**Base de données & Partage de types :**

| Point                           | Question à trancher                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| **Emplacement schémas Drizzle** | Dans `packages/shared/` (source de vérité partagée) ou dans `apps/api/` avec export ? |
| **Génération Zod**              | Build-time (script de génération) ou runtime (drizzle-zod à l'import) ?               |
| **Types partagés**              | Quels types exposer au frontend (DTOs) vs garder internes à l'API ?                   |
| **Workflow Docker**             | Structure docker-compose (dev, test, prod), volumes, networks                         |
| **Migrations Drizzle**          | Stratégie avec Drizzle Kit, intégration CI/CD                                         |
| **Seeding**                     | Données de développement, fixtures pour tests                                         |
| **Hot reload**                  | Synchronisation des types partagés en développement (watch mode)                      |

Ces points seront détaillés dans le document d'architecture (`docs/architecture.md`).

---

## 12. Annexes

### A. Glossaire

| Terme                     | Définition                                                                  |
| ------------------------- | --------------------------------------------------------------------------- |
| **Méta-personnage**       | Profil persistant du joueur (sans stats), progresse à travers les aventures |
| **Personnage d'aventure** | Personnage temporaire créé pour une aventure spécifique                     |
| **MJ IA**                 | Maître du Jeu contrôlé par intelligence artificielle                        |
| **One-shot**              | Aventure conçue pour être jouée en une session                              |
| **Campagne**              | Aventure longue sur plusieurs sessions                                      |
| **Hub**                   | Espace central où le joueur gère son méta-personnage et lance des aventures |

### B. Références maquettes

- `mockups/auth.png` — Écrans d'authentification
- `mockups/list_chara.png` — Liste (à adapter pour aventures)
- `mockups/create_chara.png` — Création personnage
- `mockups/detail_chara.png` — Détail personnage

### C. Décisions techniques documentées

| Décision           | Choix                          | Justification                                                                      |
| ------------------ | ------------------------------ | ---------------------------------------------------------------------------------- |
| Framework frontend | React + Vite (pas Next.js)     | SPA interactive, pas de besoin SSR critique, cohérence avec backend Express séparé |
| Auth               | JWT via Express (pas NextAuth) | Un seul système d'auth, contrôle total, pas de complexité de synchronisation       |
| Temps réel         | Socket.io via Express          | Support natif WebSockets pour multijoueur futur                                    |
| Pages marketing    | Webflow (externe)              | Indépendance marketing/dev, SEO natif, pas de maintenance technique                |
| ORM                | Drizzle                        | Meilleure intégration TypeScript + Zod (drizzle-zod)                               |

---

**Document généré via BMAD Method — Phase Discovery (PM)**
**Historique :**

- v1.0 (2026-02-04) : Version initiale
- v1.1 (2026-02-04) : Stack technique confirmée (React+Vite+Express), onboarding révisé (skip possible), pages marketing Webflow
