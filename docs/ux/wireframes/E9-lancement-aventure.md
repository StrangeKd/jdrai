# E9 — Lancement aventure

**Route :** `/adventure/new`
**Priorité :** P1
**Complexité :** Moyenne
**Référence composants :** UX Cartography §5.6
**Parent :** [`wireframes/README.md`](README.md)

---

## Table des matières

1. [Décisions spécifiques Lancement aventure](#1-décisions-spécifiques-lancement-aventure)
2. [Anatomie de l'écran](#2-anatomie-de-lécran)
3. [Wireframes mobile (< 768px)](#3-wireframes-mobile--768px)
4. [États d'erreur et edge cases](#4-états-derreur-et-edge-cases)
5. [Wireframes desktop (> 1024px)](#5-wireframes-desktop--1024px)
6. [Interactions et transitions](#6-interactions-et-transitions)
7. [Règles de comportement](#7-règles-de-comportement)

---

## 1. Décisions spécifiques Lancement aventure

| Décision | Choix | Alternatives écartées | Raison |
| --- | --- | --- | --- |
| Structure | **Écran unique scrollable** | Tunnel multi-étapes / wizard | Un seul écran suffit (3 paramètres + CTA). Un wizard ralentirait le lancement pour peu de valeur ajoutée. |
| Entrées multiples | **3 chemins depuis le Hub** | Un seul chemin | Respecte les 3 ActionCards du Hub (Créer, Parcourir, Aléatoire). Le chemin "Aléatoire" bypasse cet écran. |
| Création personnage | **P2 (E14)** — en P1, hérité du méta-personnage | Création intégrée à E9 | Simplifie le P1. Le personnage d'aventure reprend l'identité du méta-personnage (ou un défaut si pas de méta-perso). |
| Mode de jeu | **Solo uniquement (P1)** | Choix Solo/Multi | Multi = P3. Pas de sélecteur de mode en P1. |
| Sidebar / Tab bar | **Visibles** | Masquées | L'utilisateur n'est pas encore en session — navigation libre, retour au Hub possible (cf. UX Cartography §3.2). |
| Durée et milestones | **Durée corrélée aux milestones** | Durée en minutes | Courte = 2-3 milestones (~20 min), Moyenne = 4-5 (~45 min), Longue = 6+ (~1h+). L'utilisateur voit la durée estimée, pas le nombre de milestones. |

---

## 2. Anatomie de l'écran

```
┌───────────────────────────────┐
│  [← Hub]  Nouvelle aventure   │ ← Header avec retour
├───────────────────────────────┤
│                               │
│  Section Thème                │ ← ThemeCard (grille)
│                               │
│  Section Durée                │ ← DurationSelector
│                               │
│  Section Difficulté           │ ← DifficultySlider
│                               │
│  [CTA Lancer l'aventure]     │
│                               │
├───────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌────────┐│ ← Bottom Tab Bar
│  │ Hub  │ │Profil│ │Aventure││
│  └──────┘ └──────┘ └────────┘│
└───────────────────────────────┘
```

**Composants :** ThemeCard, DurationSelector, DifficultySlider, Bouton primaire, Bouton retour

---

## 3. Wireframes mobile (< 768px)

### WF-E9-01 — Configuration personnalisée (chemin "Créer une aventure")

```
┌─────────────────────────────────────┐
│  ←   Nouvelle aventure              │ ← Header
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                     │
│     Quel univers vous appelle ?     │ ← Titre immersif
│                                     │   (pas "Choisissez un thème")
│     ┌─────────────────────────┐     │
│     │  ┌───────┐              │     │
│     │  │ ┌───┐ │  Heroic      │     │ ← ThemeCard (sélectionnée)
│     │  │ │⚔️ │ │  Fantasy     │     │   bordure dorée = actif
│     │  │ └───┘ │              │     │
│     │  └───────┘  Quêtes      │     │
│     │             épiques,    │     │
│     │             dragons,    │     │
│     │             royaumes    │     │
│     └─────────────────────────┘     │
│     ┌─────────────────────────┐     │
│     │  🌑  Dark fantasy       │     │ ← ThemeCard (non sélectionnée)
│     │     Horreur, ombres,    │     │   bordure neutre
│     │     mystères            │     │
│     └─────────────────────────┘     │
│     ┌─────────────────────────┐     │
│     │  💫  Science-fiction     │     │ ← ThemeCard
│     │     Espace, technologie,│     │
│     │     civilisations       │     │
│     └─────────────────────────┘     │
│                                     │
│     Combien de temps avez-vous ?    │ ← Titre immersif
│                                     │
│     ┌─────────────────────────┐     │
│     │ ⚡ Courte    ~20 min    │     │ ← DurationSelector
│     ├─────────────────────────┤     │   3 options mutuellement
│     │ ⚔️ Moyenne   ~45 min    │     │   exclusives
│     ├─────────────────────────┤     │   sélectionnée = fond accent
│     │ 📖 Longue    ~1h+       │     │
│     └─────────────────────────┘     │
│                                     │
│     Quel défi souhaitez-vous ?      │ ← Titre immersif
│                                     │
│     Indulgent ━━━●━━ Impitoyable   │ ← DifficultySlider
│                                     │   5 crans, labels aux extrêmes
│     💬 Le MJ adapte la difficulté   │ ← Description dynamique
│        au niveau choisi. Les        │   change selon le cran
│        combats restent équilibrés.  │
│                                     │
│                                     │
│     ┌───────────────────────┐       │
│     │   LANCER L'AVENTURE   │       │ ← CTA primaire
│     └───────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- La flèche `←` dans le header ramène au Hub (pas de tunnel — navigation libre)
- Les ThemeCards sont empilées verticalement (mobile). Sélection unique : la carte active a une bordure dorée
- Le DurationSelector affiche l'estimation en minutes, pas le nombre de milestones (règle de visibilité)
- Le DifficultySlider a une description dynamique qui change à chaque cran pour donner du contexte
- Le CTA est toujours actif — valeurs par défaut pré-sélectionnées (à définir : thème = Heroic Fantasy, durée = Moyenne, difficulté = milieu)

### WF-E9-02 — Sélection de template (chemin "Parcourir les scénarios")

```
┌─────────────────────────────────────┐
│  ←   Scénarios disponibles          │ ← Header
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                     │
│     Choisissez votre destinée       │ ← Titre immersif
│                                     │
│     ┌─────────────────────────┐     │
│     │  🏚️ La Crypte des Ombres │     │ ← TemplateCard
│     │                         │     │
│     │  Dark fantasy · ~45 min │     │   Thème + durée + description
│     │  Difficulté : Équilibrée│     │   courte
│     │                         │     │
│     │  Explorez les profondeurs│    │
│     │  d'une crypte oubliée...│     │
│     │                         │     │
│     │       [CHOISIR]         │     │ ← CTA par carte
│     └─────────────────────────┘     │
│                                     │
│     ┌─────────────────────────┐     │
│     │  🤺  Le Tournoi d'Argent │     │ ← TemplateCard
│     │                         │     │
│     │  Heroic fantasy · ~20 min│    │
│     │  Difficulté : Facile    │     │
│     │                         │     │
│     │  Prouvez votre valeur   │     │
│     │  dans l'arène royale... │     │
│     │                         │     │
│     │       [CHOISIR]         │     │
│     └─────────────────────────┘     │
│                                     │
│     ┌─────────────────────────┐     │
│     │  👾  L'Éveil du Néant    │     │ ← TemplateCard
│     │  ...                    │     │
│     └─────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Chaque TemplateCard contient toutes les infos nécessaires (thème, durée, difficulté, description)
- Le bouton "Choisir" sur une TemplateCard lance **directement** l'aventure (pas de configuration supplémentaire)
- Les templates sont pré-configurés côté serveur — le joueur n'a rien à paramétrer
- Scroll vertical si plus de 3 templates

### WF-E9-03 — Chemin "Aventure aléatoire"

> **Pas de wireframe dédié.** Le bouton "Aventure aléatoire" du Hub (ActionCard) bypasse complètement E9.
>
> **Flow :** Hub → clic "Aventure aléatoire" → loading overlay (WF-E9-04) → E10 (session de jeu)
>
> Le système sélectionne aléatoirement un thème, une durée et une difficulté (paramètres équilibrés).

### WF-E9-04 — Loading de génération

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│          ⚔️                          │ ← Icône thématique animée
│                                     │   (rotation subtile)
│     Le Maître du Jeu prépare        │
│     votre aventure...               │ ← Texte immersif
│                                     │
│     ┌───────────────────┐           │
│     │ ████████████░░░░░░░│           │ ← Barre de progression
│     └───────────────────┘           │   (indéterminée / animée)
│                                     │
│     📖 Heroic Fantasy               │ ← Récap paramètres choisis
│     ⚔️ Moyenne · ⚖️ Équilibrée      │   (confirme que c'est bien
│                                     │    ce qui a été demandé)
│                                     │
│                                     │
│                                     │
│     (P3 : message compagnon ici)    │ ← Emplacement réservé
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Plein écran, navigation masquée (transition entre config et session)
- La barre de progression est **indéterminée** (pas de % réel — le temps de génération LLM est imprévisible)
- Le récap des paramètres rassure le joueur que ses choix sont pris en compte
- Si le joueur vient du chemin aléatoire, le récap affiche les paramètres tirés au sort
- **P3** : le compagnon pourrait intervenir ici (_"J'ai hâte de voir ça... enfin, surtout vous."_)
- Timeout : si > 15s, afficher un message supplémentaire (cf. WF-E9-05)

---

## 4. États d'erreur et edge cases

### WF-E9-05 — Échec de génération

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│          ⚠️                          │
│                                     │
│     Le Maître du Jeu n'a pas        │
│     pu préparer votre aventure.     │ ← Message d'erreur immersif
│                                     │
│     ┌───────────────────────┐       │
│     │      RÉESSAYER         │       │ ← CTA primaire (retry)
│     └───────────────────────┘       │
│                                     │
│     Retour à la configuration       │ ← Lien secondaire
│                                     │   ramène à WF-E9-01
│                                     │   (paramètres conservés)
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Le retry relance la génération avec les mêmes paramètres
- Le retour à la config conserve les paramètres sélectionnés (pas de reset)
- Retry automatique x2 avant d'afficher cet écran (le joueur ne voit l'erreur qu'après 3 tentatives)

### WF-E9-06 — Aventure déjà en cours

```
┌─────────────────────────────────────┐
│  ←   Nouvelle aventure              │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  ⚠️ Vous avez déjà une      │    │ ← Bandeau d'alerte
│  │  aventure en cours.         │    │   (pas bloquant)
│  │                             │    │
│  │  ┌─────────────┐           │    │
│  │  │  REPRENDRE   │           │    │ ← CTA primaire
│  │  └─────────────┘           │    │   (retourne à E10)
│  │                             │    │
│  │  Abandonner et commencer    │    │ ← Lien secondaire
│  │  une nouvelle aventure      │    │   (modale de confirmation)
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  (Configuration en dessous          │ ← Le reste de l'écran
│   visible en scrollant)             │   E9-01 reste accessible
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Rappel : max 1 aventure active en P1 (cf. E8 wireframe, règle 1)
- Le bandeau est affiché en haut de l'écran de configuration (pas un écran séparé)
- "Reprendre" ramène à la session en cours (E10)
- "Abandonner" ouvre une **modale de confirmation** (action destructive — l'aventure abandonnée passe en historique sans récompenses)
- Après abandon confirmé, le bandeau disparaît et la configuration est accessible normalement

### WF-E9-07 — Modale d'abandon aventure en cours

```
┌─────────────────────────────────────┐
│  (fond assombri)                    │
│                                     │
│  ┌───────────────────────────┐      │
│  │                           │      │
│  │  Abandonner l'aventure ?  │      │ ← Titre
│  │                           │      │
│  │  Votre progression dans   │      │
│  │  "La Crypte des Ombres"   │      │ ← Nom aventure
│  │  sera perdue. Cette action│      │   + conséquences claires
│  │  est irréversible.        │      │
│  │                           │      │
│  │  ┌─────────────────────┐  │      │
│  │  │     ABANDONNER       │  │      │ ← Bouton destructif (rouge)
│  │  └─────────────────────┘  │      │
│  │                           │      │
│  │  Annuler                  │      │ ← Lien secondaire
│  │                           │      │
│  └───────────────────────────┘      │
│                                     │
└─────────────────────────────────────┘
```

---

## 5. Wireframes desktop (> 1024px)

### WF-E9-08 — Configuration desktop

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌───────────────┐                                                       │
│  │  JDRAI         │   Nouvelle aventure                                   │
│  ├───────────────┤                                                       │
│  │  🏠 Hub         │   ┌────────────────────────────────────────────────┐  │
│  │  👤 Profil      │   │  Quel univers vous appelle ?                   │  │
│  │  ⚔️ Aventure    │   │                                                │  │
│  │               │   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │               │   │  │ ⚔️ Heroic     │ │ 🌑 Dark       │ │ 💫 Science-   │ │
│  │               │   │  │   Fantasy    │ │   Fantasy    │ │   fiction    │ │
│  │               │   │  │              │ │              │ │              │ │
│  │               │   │  │ Quêtes       │ │ Horreur,     │ │ Espace,     │ │
│  │               │   │  │ épiques...   │ │ ombres...    │ │ techno...   │ │
│  │               │   │  └──────────────┘ └──────────────┘ └──────────────┘ │
│  │               │   │                                                │  │
│  ├───────────────┤   │  ┌──────────────────────┐ ┌──────────────────────┐ │
│  │  ⚙️ Paramètres  │   │  │  Combien de temps    │ │  Quel défi           │ │
│  │  🚪 Déconnexion │   │  │  avez-vous ?         │ │  souhaitez-vous ?    │ │
│  └───────────────┘   │  │                      │ │                      │ │
│                      │  │ ⚡ Courte   ~20 min   │ │ Indulgent ━●━━━━     │ │
│                      │  │ ⚔️ Moyenne  ~45 min   │ │                      │ │
│                      │  │ 📖 Longue   ~1h+      │ │ 💬 Le MJ est         │ │
│                      │  └──────────────────────┘ │    bienveillant...    │ │
│                      │                           └──────────────────────┘ │
│                      │                                                │  │
│                      │           ┌────────────────────────┐           │  │
│                      │           │    LANCER L'AVENTURE   │           │  │
│                      │           └────────────────────────┘           │  │
│                      └────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Notes :**

- Sidebar visible (navigation libre, cf. §3.2)
- Les ThemeCards sont en grille horizontale (3 colonnes) au lieu d'empilées
- Durée et Difficulté côte à côte en 2 colonnes
- Le CTA est centré en bas de la zone de contenu
- Le contenu tient entièrement dans le viewport sans scroll (pas de scrolling sur desktop)

---

## 6. Interactions et transitions

### Flow par chemin d'accès

```
Hub (ActionCard "Créer")    →  WF-E9-01 (Config) → [Lancer] → WF-E9-04 (Loading) → E10

Hub (ActionCard "Parcourir") →  WF-E9-02 (Templates) → [Choisir] → WF-E9-04 (Loading) → E10

Hub (ActionCard "Aléatoire") →  WF-E9-04 (Loading) → E10
                                (bypass E9 config)
```

### Détail des interactions

| Action utilisateur | Résultat |
| --- | --- |
| Tap `←` (header) | Retour au Hub. Paramètres en cours **non** conservés (pas de brouillon). |
| Tap ThemeCard | Sélection du thème (exclusive — une seule carte active). Bordure dorée sur la carte sélectionnée. |
| Tap DurationSelector option | Sélection de la durée (exclusive). Fond accent sur l'option sélectionnée. |
| Drag/tap DifficultySlider | Déplace le curseur. La description sous le slider change dynamiquement. |
| Tap "Lancer l'aventure" | Navigation vers WF-E9-04 (loading de génération). |
| Tap "Choisir" sur TemplateCard | Navigation vers WF-E9-04 (loading). Les paramètres du template sont utilisés. |
| Tap "Reprendre" (WF-E9-06) | Navigation vers E10 (session en cours). |
| Tap "Abandonner" (WF-E9-06) | Ouvre modale WF-E9-07. |
| Confirm "Abandonner" (WF-E9-07) | Aventure en cours archivée (historique, sans récompenses). Bandeau disparaît. Config accessible. |
| Annuler (WF-E9-07) | Ferme la modale. Retour à WF-E9-06. |

---

## 7. Règles de comportement

| Règle | Description |
| --- | --- |
| **Valeurs par défaut** | Thème = Heroic Fantasy, Durée = Moyenne, Difficulté = milieu (cran 3/5). Le CTA est toujours actif — le joueur peut lancer immédiatement sans rien toucher. |
| **1 aventure active max (P1)** | Si une aventure est en cours, le bandeau WF-E9-06 s'affiche en haut. Le joueur doit reprendre ou abandonner avant d'en créer une nouvelle. |
| **Personnage d'aventure (P1)** | En P1, le personnage d'aventure hérite automatiquement du méta-personnage (nom, race, classe). Si pas de méta-personnage (skip onboarding), le MJ attribue des défauts narrativement. **P2** : E14 ajoutera un écran de personnalisation. |
| **Templates** | Scénarios pré-configurés côté serveur. Pas de paramètres à choisir — le joueur voit le résumé et lance directement. |
| **Aléatoire** | Bypass complet de E9. Le système tire au sort thème + durée + difficulté (pondéré vers des valeurs équilibrées). Le récap est visible dans WF-E9-04 (loading). |
| **Génération LLM** | Retry automatique x2 (invisible). Après 3 échecs, affichage WF-E9-05. Timeout indicatif : 10-15s pour la génération initiale. |
| **Durée et milestones** | L'utilisateur choisit une durée (Courte ~20 min, Moyenne ~45 min, Longue ~1h+). Le système corrèle en interne au nombre de milestones (2-3, 4-5, 6+). Le nombre de milestones n'est **jamais** affiché. |
| **Difficulty descriptions** | Le slider a 5 crans avec descriptions dynamiques : 1. _Indulgent — Le MJ est bienveillant, les combats sont faciles_ / 2. _Accessible_ / 3. _Équilibré_ / 4. _Exigeant_ / 5. _Impitoyable — Chaque erreur peut être fatale_ |
| **Compagnon (P3)** | Emplacements réservés sur WF-E9-04 (loading : message d'encouragement). En P1, le loading est silencieux. |

---

**Document généré via BMAD Method — Phase UX Phase 2 (Sally, UX Expert)**
