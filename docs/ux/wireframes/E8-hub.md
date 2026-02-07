# E8 — Hub

**Route :** `/hub`  
**Priorité :** P1  
**Complexité :** Élevée  
**Référence composants :** UX Cartography §5.4  
**Parent :** [`wireframes/README.md`](README.md)

---

## Table des matières

1. [Décisions spécifiques E8](#1-décisions-spécifiques-e8)
2. [Anatomie de l'écran](#2-anatomie-de-lécran)
3. [Wireframes mobile](#3-wireframes-mobile--768px)
4. [États d'erreur et edge cases](#4-états-derreur-et-edge-cases)
5. [Wireframe desktop](#5-wireframe-desktop--1024px)
6. [Interactions et transitions](#6-interactions-et-transitions)
7. [Règles de comportement](#7-règles-de-comportement)

---

## 1. Décisions spécifiques E8

| Décision                  | Choix                                 | Alternatives écartées                   | Raison                                                                                                                |
| ------------------------- | ------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Hiérarchie visuelle       | **Reprendre > Créer > Parcourir**     | Poids égal entre toutes les actions     | Le joueur de retour veut reprendre immédiatement ; le nouveau joueur voit le CTA de création en premier (empty state) |
| MetaCharacterBanner       | **Bandeau compact, scrollable**       | Carte détaillée / bandeau fixe          | Le Hub est orienté action, pas contemplation. Fixe = perte d'espace vertical sur mobile. Profil complet sur E13 (P2). |
| Aventure en cours         | **Hero card pleine largeur**          | Carte dans une grille                   | Doit être l'élément le plus visible — accès immédiat en 1 tap                                                         |
| Actions nouvelle aventure | **Grille 3 colonnes (icône + label)** | Liste verticale, boutons pleine largeur | Scannabilité rapide, feeling "raccourcis de jeu", économie d'espace vertical                                          |
| Historique                | **Carousel horizontal (mobile)**      | Grille paginée                          | Mobile-first : swipe naturel, préserve l'espace vertical pour le contenu prioritaire                                  |
| Navigation                | **Bottom tab bar visible**            | Sidebar / hamburger menu                | Mobile-first P1 ; contraste volontaire avec E10 qui masque la navigation pour l'immersion                             |

---

## 2. Anatomie de l'écran

```
┌─────────────────────────────────┐
│  MetaCharacterBanner            │ ← Scrollable (pas fixe)
│  (avatar + nom + niveau)        │
│                                 │
│  AdventureCardActive            │ ← Hero card (si aventure en cours)
│  (titre + milestone + reprendre)│
│                                 │
│  ActionCards (3 colonnes)       │ ← Raccourcis nouvelle aventure
│  (personnalisée / scénario /    │
│   aléatoire)                    │
│                                 │
│  AdventureGrid (carousel)       │ ← Historique (si applicable)
│  (aventures terminées)          │
│                                 │
├─────────────────────────────────┤
│  BottomTabBar                   │ ← Navigation fixe en bas
│  (Hub / Profil / Aventure)      │
└─────────────────────────────────┘
```

**Composants impliqués :** MetaCharacterBanner, AdventureCardActive, ActionCard, AdventureCard, AdventureGrid, BottomTabBar, EmptyState, CompanionMessage (P3)

---

## 3. Wireframes mobile (< 768px)

### WF-E8-01 — Default (aventure en cours + historique)

```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ┌────┐  Aldric le Brave     │    │ ← MetaCharacterBanner
│  │ │ 🧙 │  Chevalier errant    │    │   avatar + nom + titre actif
│  │ └────┘  ████████░░  Niv. 3  │    │   barre XP compacte
│  └─────────────────────────────┘    │
│                                     │
│  Aventure en cours                  │ ← Section label
│  ┌─────────────────────────────┐    │
│  │                              │    │
│  │  🔥 La Crypte des Ombres    │    │ ← AdventureCardActive
│  │                              │    │   hero card, fond thématique
│  │  🏴 Entrée dans la crypte   │    │ ← Milestone actuel (nom seul)
│  │  💾 Sauvegardée il y a 2h   │    │
│  │                              │    │
│  │  ┌───────────────────────┐   │    │
│  │  │      REPRENDRE        │   │    │ ← CTA primaire, proéminent
│  │  └───────────────────────┘   │    │
│  │                              │    │
│  └─────────────────────────────┘    │
│                                     │
│  Nouvelle aventure                  │ ← Section label
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │   ⚔️   │  │   📋   │  │   🎲   │ │ ← ActionCards
│  │ Person-│  │ Scéna- │  │ Aléa-  │ │   icône + label court
│  │ nalisée│  │ rio    │  │ toire  │ │
│  └────────┘  └────────┘  └────────┘ │
│                                     │
│  Aventures terminées         Tout > │ ← Section label + lien
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │ 🗡️     │  │ 🌑     │  │ 🐉     │ │ ← AdventureCards
│  │ Les    │  │ L'Ombre│  │ Le     │ │   carousel horizontal
│  │ Mines  │  │ du     │  │ Dragon │ │   (swipe →)
│  │ de     │  │ Néant  │  │ d'Or   │ │
│  │ Karak  │  │        │  │        │ │
│  │ ─ ─ ─ │  │ ─ ─ ─ │  │ ─ ─ ─ │ │
│  │ il y a │  │ il y a │  │ il y a │ │
│  │ 3 j.   │  │ 1 sem. │  │ 2 sem. │ │
│  └────────┘  └────────┘  └────────┘→│
│                                     │
├─────────────────────────────────────┤
│   🏠          👤          ⚔️       │ ← BottomTabBar
│   Hub        Profil     Aventure    │   Aventure = raccourci
│   ●                                 │   direct vers session
└─────────────────────────────────────┘
```

**Légende :**

- `●` sous Hub : onglet actif
- `████████░░` : barre de progression XP (P2 — placeholder visuel en P1)
- `🏴` : icône milestone — seul le **nom** est affiché, jamais de numéro ni pourcentage
- `→` : indicateur de scroll horizontal (carousel)
- L'onglet `⚔️ Aventure` dans la tab bar n'apparaît **que** si une aventure est en cours

### WF-E8-02 — Empty state (première visite, aucune aventure)

```
┌──────────────────────────────────────┐
│                                      │
│  ┌─────────────────────────────┐     │
│  │ ┌────┐  Aldric              │     │ ← MetaCharacterBanner
│  │ │ 🧙 │  Apprenti aventurier │     │   titre par défaut post-
│  │ └────┘  ░░░░░░░░░░  Niv. 1  │     │   onboarding, XP vide
│  └─────────────────────────────┘     │
│                                      │
│  ┌───────────────────────────────┐   │
│  │                               │   │
│  │                               │   │
│  │   ┌──────────────────────┐    │   │
│  │   │  ✒️                  │    │   │ ← EmptyState
│  │   │                      │    │   │   illustration thématique
│  │   │  C'est trop          │    │   │
│  │   │  calme ici... J'aime │    │   │ ← CompanionMessage (P3)
│  │   │  pas trop beaucoup   │    │   │
│  │   │  ça...               │    │   │
│  │   │  Et si on partait    │    │   │   en P1 : texte statique
│  │   │  à l'aventure ?      │    │   │   sans personnage
│  │   │                      │    │   │
│  │   └──────────────────────┘    │   │
│  │                               │   │
│  │   ┌───────────────────────┐   │   │
│  │   │  LANCER MA PREMIÈRE   │   │   │ ← CTA primaire unique
│  │   │      AVENTURE         │   │   │   redirige vers E9
│  │   └───────────────────────┘   │   │
│  │                               │   │
│  │  ou choisir un scénario       │   │ ← Lien secondaire discret
│  │                               │   │
│  └───────────────────────────────┘   │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│   🏠          👤                    │ ← BottomTabBar
│   Hub        Profil                 │   pas d'onglet Aventure
│   ●                                 │   (aucune en cours)
└─────────────────────────────────────┘
```

**Notes :**

- L'empty state occupe l'espace laissé libre par l'absence d'aventure et d'historique
- **P1** : texte d'invitation statique ("C'est trop calme ici...")
- **P3** : le compagnon méta (Scribe, Artefact ou Gobelin — cf. UX Cartography §7.2) prend le relais avec une réplique personnalisée
- Le CTA unique concentre l'attention : **une seule action** pour le nouveau joueur
- Le lien "ou choisir un scénario" offre une alternative discrète vers les templates

### WF-E8-03 — Profil incomplet (bandeau rappel)

> **Contexte :** Le joueur a rejoint via invitation (flow UX Cartography §2.2) et n'a pas complété l'onboarding.

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐    │
│  │ ⭐ Complétez votre profil    │    │ ← Bandeau rappel
│  │ pour débloquer vos           │    │   non-bloquant, dismissable
│  │ récompenses !         [×]   │    │   fond accent (or/ambre)
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ┌────┐  Joueur_4829         │    │ ← MetaCharacterBanner
│  │ │ 👤 │  Profil incomplet    │    │   avatar par défaut
│  │ └────┘  ░░░░░░░░░░  Niv. 1  │    │   pseudo générique
│  └─────────────────────────────┘    │
│                                     │
│  [Reste identique à WF-E8-01       │
│   ou WF-E8-02 selon le contexte]   │
│                                     │
├─────────────────────────────────────┤
│   🏠          👤          ⚔️       │
│   Hub        Profil     Aventure    │
│   ●                                 │
└─────────────────────────────────────┘
```

**Notes :**

- Le bandeau est **dismissable** (`[×]`) mais réapparaît à chaque visite tant que le profil est incomplet
- Le Hub reste **100% fonctionnel** — le profil incomplet ne bloque aucune action
- Le bandeau disparaît définitivement une fois l'onboarding complété

### WF-E8-04 — Loading (skeletons)

```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ┌────┐  ░░░░░░░░░░░░        │    │ ← Skeleton banner
│  │ │ ░░ │  ░░░░░░░░░            │    │
│  │ └────┘  ░░░░░░░░░░░░░░░░    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                              │    │
│  │  ░░░░░░░░░░░░░░░░░░░░        │    │ ← Skeleton hero card
│  │                              │    │
│  │  ░░░░░░░░░░░░░░░              │    │
│  │  ░░░░░░░░░░░░░░░░░░           │    │
│  │                              │    │
│  │  ┌───────────────────────┐   │    │
│  │  │  ░░░░░░░░░░░░░░░░░░   │   │    │
│  │  └───────────────────────┘   │    │
│  │                              │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │  ░░░░  │  │  ░░░░  │  │  ░░░░  │ │ ← Skeleton action cards
│  │  ░░░░  │  │  ░░░░  │  │  ░░░░  │ │
│  └────────┘  └────────┘  └────────┘ │
│                                     │
├─────────────────────────────────────┤
│   🏠          👤                    │
│   Hub        Profil                 │
│   ●                                 │
└─────────────────────────────────────┘
```

**Notes :**

- Les skeletons reprennent la forme exacte des composants cibles (anticipation visuelle)
- Animation pulse sur les zones `░░░` (shimmer effect)
- Durée cible : < 1s en conditions normales
- **P3** : Le compagnon pourrait afficher un message d'attente thématique

---

## 4. États d'erreur et edge cases

### WF-E8-05 — Erreur de chargement

```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ┌────┐  Aldric le Brave     │    │ ← MetaCharacterBanner
│  │ │ 🧙 │  Chevalier errant    │    │   affiché depuis le cache
│  │ └────┘  ████████░░  Niv. 3  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                              │    │
│  │     ┌─────────────────┐      │    │
│  │     │                  │      │    │
│  │     │  Impossible de   │      │    │ ← Message d'erreur
│  │     │  charger vos     │      │    │   thématique
│  │     │  aventures...    │      │    │
│  │     │                  │      │    │
│  │     │  ┌────────────┐  │      │    │
│  │     │  │  Réessayer  │  │      │    │ ← Bouton retry
│  │     │  └────────────┘  │      │    │
│  │     │                  │      │    │
│  │     └─────────────────┘      │    │
│  │                              │    │
│  └─────────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│   🏠          👤                    │
│   Hub        Profil                 │
│   ●                                 │
└─────────────────────────────────────┘
```

**Notes :**

- Le MetaCharacterBanner peut s'afficher depuis le cache même en cas d'erreur réseau
- Si aucune donnée en cache → skeleton + message d'erreur combinés
- **P3** : Le compagnon contextualise ("Les parchemins se sont envolés... Réessayons.")

### WF-E8-06 — Session expirée (retour après reconnexion)

Pas de wireframe spécifique — le joueur arrive sur le Hub normalement après re-login. Un **toast** confirme le retour :

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐    │
│  │  ✓ Reconnecté ! Bon retour. │    │ ← Toast success
│  └─────────────────────────────┘    │   disparaît après 3s
│                                     │
│  [Hub normal — WF-E8-01]           │
│                                     │
└─────────────────────────────────────┘
```

---

## 5. Wireframe desktop (> 1024px)

### WF-E8-07 — Desktop — Default

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│ ┌──────────┐  ┌──────────────────────────────────────────────────────┐   │
│ │          │  │                                                      │   │
│ │  JDRAI   │  │  ┌──────────────────────────────────────────────┐    │   │
│ │          │  │  │ ┌────┐                                        │    │   │
│ │ ─ ─ ─ ─ │  │  │ │ 🧙 │  Aldric le Brave — Chevalier errant   │    │   │
│ │          │  │  │ └────┘  ████████░░ Niveau 3                   │    │   │
│ │  🏠 Hub  │  │  └──────────────────────────────────────────────┘    │   │
│ │  ● actif │  │                                                      │   │
│ │          │  │  Aventure en cours                                    │   │
│ │  👤 Pro- │  │  ┌──────────────────────────────────────────────┐    │   │
│ │  fil     │  │  │                                              │    │   │
│ │          │  │  │  🔥 La Crypte des Ombres                    │    │   │
│ │  ⚔️ Aven-│  │  │                                              │    │   │
│ │  ture    │  │  │  🏴 Entrée dans la crypte                   │    │   │
│ │          │  │  │  💾 Sauvegardée il y a 2h                   │    │   │
│ │          │  │  │                               [REPRENDRE]    │    │   │
│ │          │  │  │                                              │    │   │
│ │          │  │  └──────────────────────────────────────────────┘    │   │
│ │          │  │                                                      │   │
│ │          │  │  Nouvelle aventure                                    │   │
│ │          │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │   │
│ │          │  │  │     ⚔️       │ │     📋       │ │     🎲       │  │   │
│ │          │  │  │ Personnalisée│ │   Scénario   │ │  Aléatoire   │  │   │
│ │          │  │  │              │ │              │ │              │  │   │
│ │          │  │  │ Choisissez   │ │ Partez sur   │ │ Laissez le   │  │   │
│ │          │  │  │ votre thème, │ │ un scénario  │ │ destin       │  │   │
│ │          │  │  │ durée et     │ │ pré-conçu    │ │ décider !    │  │   │
│ │          │  │  │ difficulté   │ │              │ │              │  │   │
│ │          │  │  └──────────────┘ └──────────────┘ └──────────────┘  │   │
│ │          │  │                                                      │   │
│ │ ─ ─ ─ ─ │  │  Aventures terminées                          Tout > │   │
│ │ ⚙️ Para- │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│   │
│ │ mètres   │  │  │ 🗡️ Les   │ │ 🌑 L'Om- │ │ 🐉 Le    │ │ 🏰 La   ││   │
│ │          │  │  │ Mines de │ │ bre du   │ │ Dragon  │ │ Tour    ││   │
│ │ 🚪 Déco- │  │  │ Karak    │ │ Néant    │ │ d'Or    │ │ Maudite ││   │
│ │ nnexion  │  │  │ il y a   │ │ il y a   │ │ il y a  │ │ il y a  ││   │
│ │          │  │  │ 3 jours  │ │ 1 sem.   │ │ 2 sem.  │ │ 1 mois  ││   │
│ │          │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘│   │
│ └──────────┘  └──────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Notes desktop :**

- Sidebar visible à gauche (contrairement à E10 qui la masque pour l'immersion)
- Contenu centré avec `max-width: ~960px`
- ActionCards plus larges — intègrent une **description courte** en plus de l'icône et du label
- Historique en **grille 4 colonnes** (au lieu du carousel mobile)
- Onglet `⚔️ Aventure` dans la sidebar = raccourci direct vers la session en cours
- **Paramètres** (P2) et **Déconnexion** en bas de sidebar

---

## 6. Interactions et transitions

| Action utilisateur                 | Résultat                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| Tap MetaCharacterBanner            | Navigation vers E13 Profil (P2). En P1 : pas d'action ou toast "Bientôt disponible" |
| Tap `[REPRENDRE]`                  | Navigation vers E10 Session (`/adventure/:id`)                                      |
| Tap ActionCard "Personnalisée"     | Navigation vers E9 Lancement (`/adventure/new`)                                     |
| Tap ActionCard "Scénario"          | Navigation vers E9 avec présélection mode templates                                 |
| Tap ActionCard "Aléatoire"         | Navigation vers E9 avec génération aléatoire directe                                |
| Tap AdventureCard historique       | Navigation vers E11 Résumé (`/adventure/:id/summary`)                               |
| Tap `Tout >` (historique)          | Navigation vers liste complète des aventures terminées                              |
| Tap onglet `⚔️ Aventure` (tab bar) | Navigation directe vers E10 Session (raccourci = REPRENDRE)                         |
| Tap onglet `👤 Profil` (tab bar)   | Navigation vers E13 Profil (P2)                                                     |
| Swipe horizontal sur historique    | Scroll carousel des aventures terminées (mobile)                                    |
| Pull-to-refresh (mobile)           | Rafraîchit les données du Hub (aventure en cours, historique)                       |
| Dismiss bandeau `[×]`              | Masque le bandeau profil incomplet pour la session courante                         |

---

## 7. Règles de comportement

| Règle                 | Description                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Aventure en cours** | Maximum **une** aventure active en P1. La section "Aventure en cours" n'apparaît que si une aventure est en pause.                                                                         |
| **Milestone affiché** | Le nom du milestone actuel est affiché sur l'AdventureCardActive. **Jamais** de progression numérique (pas de "2/4", pas de "%"). Cf. UX Cartography §7.1 principe 6.                      |
| **Onglet Aventure**   | L'onglet `⚔️ Aventure` dans la tab bar / sidebar n'apparaît que si une aventure est en cours. Il sert de raccourci direct vers E10.                                                        |
| **Empty state**       | Si aucune aventure (ni en cours, ni terminée) : afficher l'EmptyState avec CTA engageant (WF-E8-02). Les ActionCards "Scénario" et "Aléatoire" restent accessibles via le lien secondaire. |
| **Historique**        | Trié par date de complétion (plus récent en premier). Limité aux ~4/5 dernières sur le Hub, page complète via "Tout >".                                                                    |
| **Cache**             | Le MetaCharacterBanner est mis en cache pour un affichage instantané au retour. Les données d'aventures sont rafraîchies en arrière-plan (stale-while-revalidate).                         |
| **Profil incomplet**  | Bandeau dismissable par session mais réapparaît à chaque visite tant que l'onboarding n'est pas complété. N'apparaît que pour le flow "rejoindre un ami" (UX Cartography §2.2).            |
| **Compagnon (P3)**    | Emplacements réservés dans : empty state, loading, erreur. En P1, messages statiques sans personnage.                                                                                      |
| **Pull-to-refresh**   | Disponible sur mobile uniquement. Rafraîchit aventure en cours + historique.                                                                                                               |

---

**Document généré via BMAD Method — Phase UX Phase 2 (Sally, UX Expert)**
