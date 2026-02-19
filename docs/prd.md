# JDRAI - Product Requirements Document (PRD)

**Version:** 1.5
**Date:** 2026-02-17
**Statut:** Validé par CEO
**Dernière mise à jour:** Alignement GDD v1.0 — D20 décision (F2), Heroic Fantasy P1 (F2), noms difficulté (F2), §11 Q1 résolu
**Auteur:** PM (BMAD Method)
**Références :** `docs/game-design.md` (source de vérité pour les mécaniques de jeu et l'expérience joueur)

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

### 3.4 Structure narrative : Milestones & Events

Les aventures sont structurées selon une hiérarchie narrative qui permet au MJ IA de gérer la durée et le déroulement :

```
AVENTURE
│
├── 🏴 MILESTONE — Jalon narratif majeur (obligatoire)
│   │               Structure l'aventure et en prédit la durée.
│   │               Ex : Réception de la quête, Confrontation finale
│   │
│   ├── ○ EVENT — Rencontre/situation entre milestones (optionnel ou obligatoire)
│   │              Le MJ guide, mais les choix du joueur peuvent contourner
│   │              certains events. Ex : visite d'échoppes, grotte secondaire
│   │
│   └── (Scènes) — Séquence cohérente d'échanges MJ-joueur au sein d'un event
│                   Ex : discuter avec un PNJ, explorer une salle
```

**Priorisation :**

| Concept        | Priorité | Justification                                                                   |
| -------------- | -------- | ------------------------------------------------------------------------------- |
| **Milestones** | **P1**   | Fondamental pour structurer les aventures du MJ IA et gérer la durée dès le MVP |
| **Events**     | **P2**   | Structuration plus fine entre milestones, enrichit l'expérience post-MVP        |

**Règle UX** : Le nom du milestone en cours peut être affiché (ex : "Réception de la quête" dans l'historique), mais **jamais de progression numérique** (pas de "2/4" ni "50%"). L'aventure reste une expérience narrative, pas un tableau de bord.

> Référence complète : `docs/ux/ux-cartography.md` §2.6

---

## 4. Fonctionnalités

### 4.1 Priorisation MVP

| Priorité | Feature                          | Description                                                                   |
| -------- | -------------------------------- | ----------------------------------------------------------------------------- |
| **P1**   | Authentification                 | Inscription, connexion, gestion de session (Better Auth)                      |
| **P1**   | Session solo MJ IA               | Aventure textuelle avec MJ IA (choix hybrides), menu de jeu intégré           |
| **P1**   | Sauvegarde/Reprise               | Sauvegarder et reprendre une aventure en cours                                |
| **P1**   | Onboarding/Tutoriel              | Parcours guidé (welcome, profile-setup, tutoriel-aventure)                    |
| **P1**   | Navigation mobile-first          | Bottom tab bar mobile, sidebar responsive, conception mobile-first            |
| **P1**   | Structure narrative (Milestones) | Jalons narratifs structurant les aventures et leur durée estimée              |
| **P1**   | Résilience session               | Gestion rate limiting (429), reconnexion basique en session                   |
| **P2**   | Events narratifs                 | Structuration fine entre milestones (rencontres, situations)                  |
| **P2**   | Méta-personnage                  | Profil joueur avec progression, cosmétiques + page profil dédiée              |
| **P2**   | Personnalisation MJ              | Ajustement basique (ton, difficulté, style) + verrouillage en session         |
| **P2**   | Création personnage aventure     | Race, classe, background, stats                                               |
| **P2**   | Paramètres utilisateur           | Gestion compte, préférences (version simple)                                  |
| **P2**   | Résilience aventure              | Bouton "MJ bloqué" avec reset contexte                                        |
| **P3**   | Compagnon d'interface            | Mascotte méta récurrente (loading, erreurs, transitions, onboarding)          |
| **P3**   | Génération d'images              | Illustrations de scènes et personnages                                        |
| **P3**   | Multijoueur                      | Sessions à plusieurs joueurs                                                  |
| **P3**   | Parcours "Rejoindre un ami"      | Onboarding express via invitation, jonction session, récompenses rétroactives |
| **P3**   | Paramètres utilisateur complet   | Notifications, préférences avancées, compagnon on/off                         |
| **P3**   | Détection double onglet          | Avertissement aventure ouverte dans un autre onglet                           |
| **P4**   | Narration audio                  | Voix synthétisée pour le MJ                                                   |
| **P4**   | Genres additionnels              | Dark fantasy, sci-fi, etc.                                                    |

### 4.2 Détail des features MVP (P1)

#### F1. Authentification

- Inscription (email + mot de passe)
- Connexion / Déconnexion
- Récupération de mot de passe
- Session persistante (Better Auth, cookies httpOnly)
- **Vérification email** : Non-bloquante en P1. Un email de vérification est envoyé à l'inscription, mais le joueur accède directement à l'onboarding sans attendre. Bandeau de rappel dans le Hub tant que l'email n'est pas vérifié.

#### F2. Session solo MJ IA

- Lancement d'aventure avec paramètres :
  - **Thème/ambiance** : Heroic Fantasy uniquement en P1 (appliqué par défaut, pas de sélecteur). Genres additionnels → P4 (cf. §4.4 F17)
  - Durée estimée (courte, moyenne, longue) — corrélée au nombre de milestones (courte = 2-3, longue = 6+)
  - Difficulté : 4 niveaux — Facile, Normal, Difficile, Cauchemar (cf. GDD §9). Verrouillée en session
- OU sélection d'un scénario template (2 templates contrastés en P1 — cf. GDD GD-008)
- OU génération aléatoire
- **Structure par milestones** : Chaque aventure est découpée en jalons narratifs obligatoires (cf. §3.4). Le MJ IA utilise cette structure pour piloter la durée et la progression narrative
- Interaction hybride : choix suggérés (2-4) + texte libre
- Narration textuelle immersive — MJ IA persona "Le Chroniqueur" (cf. GDD §4)
- **Système de résolution D20** : Un dé 20 faces est lancé en arrière-plan à chaque action significative. Le résultat est injecté dans le prompt MJ — jamais visible pour le joueur en P1. Visibilité optionnelle post-MVP (cf. GDD GD-001)
- **Navigation en session** : La sidebar/navigation classique est masquée. Un bouton de menu intégré à l'interface de jeu (style jeu vidéo, pas burger menu classique) donne accès aux actions : quitter, sauvegarder, paramètres MJ
- **Confirmation de sortie** : Toute action quittant le mode aventure (changement de page, déconnexion, fermeture onglet) déclenche une fenêtre de confirmation pour éviter la perte de progression involontaire
- Gestion du rate limiting (429) : désactivation temporaire de la saisie, message utilisateur, réactivation après délai
- Reconnexion basique en cas de perte de connexion : message non-bloquant, auto-reconnexion, reprise depuis dernier état sauvegardé

#### F3. Sauvegarde/Reprise

- Sauvegarde automatique de l'état de l'aventure
- Liste des aventures en cours (avec nom du milestone actuel affiché)
- **Limite** : Maximum **5 aventures solo actives** simultanément. Au-delà, le joueur doit terminer ou abandonner une aventure pour en lancer une nouvelle. Cette limite évite l'accumulation de contenu inachevé. Le mode multijoueur (P3) aura son propre compteur séparé.
- Reprise à tout moment
- Historique des aventures terminées
- **Historique en session** : Drawer affichant l'historique groupé par milestones (cf. `docs/ux/wireframes/E10-session-de-jeu.md` §WF-E10-07)

#### F4. Onboarding/Tutoriel

**Parcours standard (3 étapes) :**

- **Welcome** : Bienvenue + explication du concept
- **Profile-setup** : Choix du pseudo + bases du profil
- **Tutoriel** : Première aventure solo guidée (= session de jeu en mode accompagné)
  - Création du méta-personnage intégrée narrativement (choix de race, classe en contexte)
  - Le personnage créé pour cette aventure devient le méta-personnage

**Mécanismes de flexibilité (P1) :**

- Skip du tutoriel possible (le joueur peut choisir d'aller directement au Hub)
- Profil "incomplet" (nom uniquement) = fonctionnel pour jouer
- Rappel non-intrusif pour compléter le profil depuis le Hub
- Tutoriel accessible à tout moment depuis le Hub

> **Note** : Le parcours spécifique "Rejoindre un ami" (invitation → profil express → jonction session multijoueur → récompenses rétroactives) dépend des features multijoueur et est donc classé **P3** (cf. §4.4 F13). Les mécanismes génériques ci-dessus (skip, profil incomplet, reprise tutoriel) sont P1 et seront réutilisés par ce parcours.

### 4.3 Détail des features importantes (P2)

#### F5. Méta-personnage (+ page Profil)

- Création lors de l'onboarding
- Éléments : nom, avatar, origine/background
- Progression : niveaux, XP gagnée par aventure
- Succès : achievements débloquables
- Cosmétiques : titres, éléments visuels
- Modificateurs légers (optionnel, faible impact)
- Fonction template pour personnages d'aventure
- **Page Profil dédiée** (`/profile`) : vue détaillée avec sections Identité, Progression, Cosmétiques (le Hub P1 n'affiche qu'un résumé)

#### F6. Personnalisation MJ

- Ton/personnalité : sérieux, humoristique, épique, sombre
- Difficulté : indulgent → impitoyable
- Rigueur des règles : narratif libre → strict
- Style narratif : concis → descriptif
- **Accès en session** via panneau latéral (drawer), sans quitter l'aventure :
  - **Ajustements légers** (modifiables en session) : ton, niveau de détail narratif, longueur des réponses
  - **Paramètres structurels** (verrouillés en session) : difficulté, rigueur des règles — avec tooltip explicatif

#### F7. Création personnage aventure

- Choix de race (liste à définir)
- Choix de classe/archétype
- Background/origine (presets ou libre)
- Distribution de points de stats
- Nom (libre ou généré)
- Option : partir du template méta-personnage

#### F8. Paramètres utilisateur (version simple)

- Gestion du compte : email, mot de passe, suppression de compte
- Préférences : thème (clair/sombre/système), langue
- Version complète en P3 (notifications, préférences avancées, compagnon on/off)

#### F9. Résilience aventure

- Bouton de secours "Le MJ semble perdu" → relance du contexte narratif avec options alternatives
- Reset de contexte côté LLM pour débloquer les boucles IA

### 4.4 Détail des features sociales et avancées (P3)

#### F10. Compagnon d'interface (mascotte méta)

> **Note architecture** : Bien que le développement soit P3, les composants et la structure doivent être anticipés dès la conception pour faciliter l'intégration future. Les emplacements d'intervention (loading, erreurs, empty states, onboarding, transitions) existent dès le MVP sous forme standard — le compagnon les remplacera par une version immersive.

- Personnage récurrent **hors session de jeu** (le MJ IA reste le seul narrateur en session)
- Intervient sur : loading LLM, erreurs/timeouts, onboarding, succès/récompenses, empty states, retours après absence
- Jamais bloquant (informatif/décoratif uniquement, pas de modale exigeant une action)
- Fréquence maîtrisée (moments clés : transitions, attentes, erreurs, premiers usages)
- Désactivable dans les paramètres utilisateur
- Évolutif : répliques adaptées au niveau du méta-personnage
- Pistes de personnage : Le Scribe, L'Artefact, Le Gobelin de service (choix à affiner en Phase 2 UX)
- Référence complète : `docs/ux/ux-cartography.md` §7.2

#### F11. Détection double onglet

- Détection d'une même aventure ouverte dans plusieurs onglets
- Avertissement non-bloquant pour éviter les conflits de sauvegarde

#### F12. Paramètres utilisateur (version complète)

- Notifications (préparation multijoueur)
- Préférences avancées : compagnon on/off
- Finalisation des éléments non couverts par la version simple P2

#### F13. Parcours "Rejoindre un ami"

> Dépend de : Multijoueur (P3). Réutilise les mécanismes P1 de skip tutoriel et profil incomplet (cf. F4).

- Réception d'un lien/code d'invitation
- Inscription (si nouveau) ou connexion (si existant)
- Profil express : pseudo uniquement (skip tutoriel automatique)
- Création de personnage rapide (preset recommandé ou manuel)
- Jonction directe de la session multijoueur en cours
- Récompenses de l'aventure stockées et liées rétroactivement au méta-personnage une fois celui-ci complété
- Rappel dans le Hub pour compléter le tutoriel et le méta-personnage

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
                    Nouvelle aventure         Rejoindre une partie (P3)
                              ↓                           ↓
                    Paramètres + Création         Code / Lobby (P3)
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

**Parcours "Rejoindre un ami" (P3 — dépend du multijoueur) :**

```
Lien invitation → Inscription → Skip tutoriel → Profil express (nom)
                                                        ↓
                                        Création perso rapide (preset)
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

### 5.3 Approche design

- **Mobile-first** : La conception part du mobile (session de jeu = interaction chat/choix naturellement adaptée au mobile)
- **Bottom tab bar** mobile (Hub, Profil, Aventure) — sidebar desktop classique
- **Sidebar immersive** : En session de jeu, la sidebar est masquée (icônes uniquement) pour maximiser l'immersion
- Référence complète : `docs/ux/ux-cartography.md` (navigation §3.2, responsive §7.5)
- **Wireframes de référence** : `docs/ux/wireframes/E10-session-de-jeu.md` — wireframes détaillés de la session de jeu (E10), incluant la structure par milestones dans l'historique

### 5.4 Maquettes existantes

Les maquettes UX/UI suivantes sont disponibles comme **inspiration libre** (cf. `docs/ux/ux-cartography.md` §1.2 pour le statut détaillé) :

| Écran                             | Fichier                    | Statut                                                 |
| --------------------------------- | -------------------------- | ------------------------------------------------------ |
| Authentification (Login/Register) | `mockups/auth.png`         | Base fiable — adapter (ajouter pseudo à l'inscription) |
| Liste des personnages             | `mockups/list_chara.png`   | Inspiration libre — reconcevoir pour le Hub            |
| Création personnage               | `mockups/create_chara.png` | Inspiration libre — reconcevoir                        |
| Détail personnage                 | `mockups/detail_chara.png` | Inspiration libre — reconcevoir pour profil méta-perso |

**Écrans à concevoir :**

- Session de jeu (coeur produit, 90% du temps utilisateur)
- Hub (point d'entrée central)
- Onboarding (welcome, profile-setup, tutoriel)
- Lancement d'aventure (paramètres)
- Écran de fin (résumé + récompenses)

---

## 6. Spécifications Techniques

### 6.1 Stack technique

| Couche              | Technologie                                     |
| ------------------- | ----------------------------------------------- |
| **Monorepo**        | Turborepo + pnpm workspaces                     |
| **Frontend (App)**  | React 18+, Vite, TypeScript                     |
| **Routing**         | TanStack Router                                 |
| **UI**              | Tailwind CSS, ShadCN/UI                         |
| **Formulaires**     | React Hook Form + Zod                           |
| **State/Data**      | TanStack Query                                  |
| **State UI**        | Zustand (préférences locales, UI transient)     |
| **Backend**         | Node.js, Express, TypeScript                    |
| **Auth**            | Better Auth (cookies httpOnly, Drizzle adapter) |
| **ORM**             | Drizzle + drizzle-zod                           |
| **Base de données** | PostgreSQL                                      |
| **Temps réel**      | Socket.io (pour multijoueur futur)              |
| **LLM**             | Multi-provider (Mammouth AI ou équivalent)      |

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

### 8.0 Principe de livraison : testabilité continue

> **Règle absolue** : Chaque fonctionnalité ou parcours livré doit être testable "en vrai" — c'est-à-dire que le CEO (ou tout stakeholder) doit pouvoir lancer l'application et tester le flow de bout en bout, sans configuration technique particulière ni mocks manuels.

**Ce que cela implique pour le PO et le dev :**

- **Découpage vertical** : Chaque story ou incrément livre une tranche fonctionnelle complète (front + back + données), pas une couche technique isolée (ex : pas "créer le schéma DB" sans UI pour le voir)
- **Environnement de démo permanent** : L'application doit être lançable localement à tout moment avec un état fonctionnel (seeds de données, configuration par défaut)
- **Pas de feature invisible** : Si un parcours a avancé, il doit être accessible depuis l'interface, même si c'est une version simplifiée
- **Feedback rapide** : La boucle "dev → démo → feedback" doit être la plus courte possible

### Phase 1 : MVP (P1)

- Authentification complète (Better Auth)
- Onboarding en 3 étapes (welcome, profile-setup, tutoriel-aventure)
- Session solo MJ IA (texte, one-shot) avec sidebar immersive
- **Structure narrative par milestones** (jalons obligatoires, durée estimée, historique groupé)
- Sauvegarde/reprise
- Navigation mobile-first (bottom tab bar + sidebar responsive)
- Résilience session (gestion 429, reconnexion basique)

### Phase 2 : Enrichissement (P2)

- **Events narratifs** entre milestones (structuration fine des rencontres/situations)
- Méta-personnage complet (progression, succès, cosmétiques) + page Profil dédiée
- Personnalisation MJ avec distinction verrouillé/ajustable en session
- Création personnage aventure enrichie
- Paramètres utilisateur (version simple : compte, préférences)
- Résilience aventure (bouton "MJ bloqué", reset contexte)

### Phase 3 : Social + Polish (P3)

- Mode multijoueur
- Compagnon d'interface (mascotte méta)
- Génération d'images
- Paramètres utilisateur complet (notifications, compagnon on/off)
- Détection double onglet

### Phase 4 : Extension (P4)

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

1. ~~**Mécaniques de dés** : Dés visibles vs calculs cachés — à tester avec utilisateurs~~ → **RÉSOLU (GDD GD-001)** : D20 caché en P1, résultat injecté dans le prompt MJ. Visibilité optionnelle post-MVP (style Baldur's Gate 3). Implémentation : backend génère le roll D20 avant chaque appel LLM ; résultat transmis dans le prompt système, invisible côté frontend.
2. **Progression in-aventure** : ~~XP/niveaux vs milestones narratifs~~ → **Milestones narratifs retenus** (cf. §3.4). Pas de progression numérique visible. Reste à définir : impact des milestones sur les récompenses XP méta-personnage
3. **Taille max groupe multijoueur** : À définir selon retours
4. **Sync vs Async multijoueur** : À définir selon retours
5. **Système de règles détaillé** : À concevoir (races, classes, stats, équilibrage)

### Contraintes techniques (traitées en Phase Architecture)

> Les points ci-dessous ont été tranchés dans `docs/architecture.md`. Ils restent listés ici comme référence.

**Base de données & Partage de types :**

| Point                           | Question d'origine                                                                    | Statut                             |
| ------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| **Emplacement schémas Drizzle** | Dans `packages/shared/` (source de vérité partagée) ou dans `apps/api/` avec export ? | → `apps/api/src/db/schema/`        |
| **Génération Zod**              | Build-time (script de génération) ou runtime (drizzle-zod à l'import) ?               | → drizzle-zod                      |
| **Types partagés**              | Quels types exposer au frontend (DTOs) vs garder internes à l'API ?                   | → DTOs dans `packages/shared/`     |
| **Workflow Docker**             | Structure docker-compose (dev, test, prod), volumes, networks                         | → `docker/docker-compose.yml`      |
| **Migrations Drizzle**          | Stratégie avec Drizzle Kit, intégration CI/CD                                         | → Drizzle Kit, cf. architecture §9 |
| **Seeding**                     | Données de développement, fixtures pour tests                                         | → `apps/api/src/db/seeds/`         |
| **Hot reload**                  | Synchronisation des types partagés en développement (watch mode)                      | → Turborepo watch mode             |

Référence complète : `docs/architecture.md`

---

## 12. Annexes

### A. Glossaire

| Terme                     | Définition                                                                    |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Méta-personnage**       | Profil persistant du joueur (sans stats), progresse à travers les aventures   |
| **Personnage d'aventure** | Personnage temporaire créé pour une aventure spécifique                       |
| **MJ IA**                 | Maître du Jeu contrôlé par intelligence artificielle                          |
| **One-shot**              | Aventure conçue pour être jouée en une session                                |
| **Campagne**              | Aventure longue sur plusieurs sessions                                        |
| **Hub**                   | Espace central où le joueur gère son méta-personnage et lance des aventures   |
| **Milestone**             | Jalon narratif majeur structurant une aventure (obligatoire). Prédit la durée |
| **Event**                 | Rencontre ou situation entre milestones (optionnel ou obligatoire, P2)        |
| **Scène**                 | Séquence cohérente d'échanges MJ-joueur au sein d'un event                    |

### B. Références maquettes

- `mockups/auth.png` — Écrans d'authentification
- `mockups/list_chara.png` — Liste (à adapter pour aventures)
- `mockups/create_chara.png` — Création personnage
- `mockups/detail_chara.png` — Détail personnage

### C. Décisions techniques documentées

| Décision           | Choix                                   | Justification                                                                                                        |
| ------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Framework frontend | React + Vite (pas Next.js)              | SPA interactive, pas de besoin SSR critique, cohérence avec backend Express séparé                                   |
| Auth               | Better Auth (pas JWT manuel / NextAuth) | TypeScript-first, Drizzle natif, cookies httpOnly, CSRF automatique, abstraction AuthService pour limiter le lock-in |
| Temps réel         | Socket.io via Express                   | Support natif WebSockets pour multijoueur futur                                                                      |
| Pages marketing    | Webflow (externe)                       | Indépendance marketing/dev, SEO natif, pas de maintenance technique                                                  |
| ORM                | Drizzle                                 | Meilleure intégration TypeScript + Zod (drizzle-zod)                                                                 |
| State UI           | Zustand                                 | Léger, API simple, middleware persist pour préférences locales                                                       |

---

**Document généré via BMAD Method — Phase Discovery (PM)**
**Historique :**

- v1.0 (2026-02-04) : Version initiale
- v1.1 (2026-02-04) : Stack technique confirmée (React+Vite+Express), onboarding révisé (skip possible), pages marketing Webflow
- v1.2 (2026-02-06) : Audit de cohérence post-UX cartography — Auth corrigée (Better Auth), ajout Zustand, navigation mobile-first (P1), résilience session (P1), paramètres utilisateur (P2), page profil (P2), personnalisation MJ verrouillé/ajustable (P2), compagnon d'interface (P3), détection double onglet (P3), roadmap réalignée
- v1.3 (2026-02-06) : Intégration structure narrative Milestones & Events (UX §2.6) — §3.4 concept, milestones P1, events P2, F2/F3 mis à jour, glossaire enrichi, question progression résolue, référence wireframes ajoutée
- v1.4 (2026-02-08) : Audit cohérence wireframes/architecture — F1 ajout vérification email non-bloquante, F3 ajout limite 5 aventures solo actives
- v1.5 (2026-02-17) : Alignement GDD v1.0 — F2 : D20 caché P1 (GDD-001 résolu), Heroic Fantasy uniquement P1, 4 niveaux difficulté nommés (Facile/Normal/Difficile/Cauchemar), persona MJ "Le Chroniqueur". §11.1 Q1 marqué résolu. Référence GDD ajoutée.
