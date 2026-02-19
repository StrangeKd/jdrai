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

| Décision              | Choix                                           | Alternatives écartées         | Raison                                                                                                                                            |
| --------------------- | ----------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structure             | **Écran unique scrollable**                     | Tunnel multi-étapes / wizard  | Un seul écran suffit (3 paramètres + CTA). Un wizard ralentirait le lancement pour peu de valeur ajoutée.                                         |
| Entrées multiples     | **3 chemins depuis le Hub**                     | Un seul chemin                | Respecte les 3 ActionCards du Hub (Créer, Parcourir, Aléatoire). Tous les chemins passent par un écran de confirmation avant la génération.       |
| Confirmation          | **Écran de confirmation systématique**          | Lancement direct après config | Permet de vérifier les paramètres avant la génération (évite les erreurs). En mode aléatoire, option "Accepter l'inconnu" pour bypasser.          |
| Aventures simultanées | **Max 5 aventures solo actives**                | 1 aventure active             | Permet de jouer plusieurs aventures en parallèle (et anticipe le multi P2+). Limite à 5 pour éviter l'accumulation de contenu inachevé.           |
| Création personnage   | **P2 (E14)** — en P1, hérité du méta-personnage | Création intégrée à E9        | Simplifie le P1. Le personnage d'aventure reprend l'identité du méta-personnage (ou un défaut si pas de méta-perso).                              |
| Mode de jeu           | **Solo uniquement (P1)**                        | Choix Solo/Multi              | Multi = P2. Pas de sélecteur de mode en P1.                                                                                                       |
| Sidebar / Tab bar     | **Visibles**                                    | Masquées                      | L'utilisateur n'est pas encore en session — navigation libre, retour au Hub possible (cf. UX Cartography §3.2).                                   |
| Durée et milestones   | **Durée corrélée aux milestones**               | Durée en minutes              | Courte = 2-3 milestones (~20 min), Moyenne = 4-5 (~45 min), Longue = 6+ (~1h+). L'utilisateur voit la durée estimée, pas le nombre de milestones. |

---

## 2. Anatomie de l'écran

```
┌───────────────────────────────┐
│  [← Hub]  Nouvelle aventure   │ ← Header avec retour
├───────────────────────────────┤
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

**Composants :** DurationSelector, DifficultySlider, Bouton primaire, Bouton retour (P4 : ThemeCard pour le choix d'univers)

---

## 3. Wireframes mobile (< 768px)

### WF-E9-01 — Configuration personnalisée (chemin "Créer une aventure")

```
┌─────────────────────────────────────┐
│  ←   Nouvelle aventure              │ ← Header
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
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
│     Facile ━━●━━━━━━ Cauchemar      │ ← DifficultySlider
│                                     │   4 crans, labels aux extrêmes
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
- **Pas de sélection de thème en P1** — l'univers Heroic Fantasy est appliqué par défaut. Le sélecteur de thème (ThemeCard) sera ajouté en P4 quand les genres additionnels seront disponibles
- Le DurationSelector affiche l'estimation en minutes, pas le nombre de milestones (règle de visibilité)
- Le DifficultySlider a une description dynamique qui change à chaque cran pour donner du contexte (4 crans)
- Le CTA est toujours actif — valeurs par défaut pré-sélectionnées (durée = Moyenne, difficulté = Normal)

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
│     │  Heroic fantasy · ~45 min│    │   Thème + durée + description
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

### WF-E9-03 — Confirmation avant lancement

Écran intermédiaire entre la configuration et la génération. S'affiche pour **tous les chemins** (personnalisée, template, aléatoire).

```
┌─────────────────────────────────────┐
│  ←   Confirmation                   │ ← Header
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                     │
│     Prêt à partir ?                 │ ← Titre immersif
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  📖 Univers                  │    │ ← Toujours "Heroic Fantasy"
│  │     Heroic Fantasy          │    │   en P1 (P4 : choix univers)
│  │                             │    │
│  │  ⏱️ Durée                   │    │
│  │     Moyenne (~45 min)       │    │
│  │                             │    │
│  │  ⚖️ Difficulté              │    │
│  │     Équilibrée              │    │
│  │                             │    │
│  │  🧙 Personnage              │    │ ← Info personnage (P1 : méta-
│  │     Aldric le Brave         │    │   personnage ou défaut)
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     ┌───────────────────────┐       │
│     │    LANCER L'AVENTURE   │       │ ← CTA primaire
│     └───────────────────────┘       │
│                                     │
│     Modifier les paramètres         │ ← Lien retour → E9-01/E9-02
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Le récap affiche les paramètres choisis (config) ou pré-définis (template/aléatoire)
- Le lien "Modifier" ramène à l'écran précédent (E9-01 ou E9-02 selon le chemin)
- Pour le chemin **template**, le récap inclut aussi le nom du scénario
- Pour le chemin **aléatoire**, le joueur passe d'abord par WF-E9-03b (choix surprise) avant toute révélation

### WF-E9-03b — Choix surprise (aléatoire)

Premier écran du chemin aléatoire. Le joueur choisit s'il veut voir les paramètres tirés au sort ou garder la surprise **avant toute révélation**.

```
┌─────────────────────────────────────┐
│  ←   Aventure aléatoire             │ ← Header
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                     │
│                                     │
│              🎲                      │ ← Icône dés
│                                     │
│     Le destin a parlé.              │ ← Titre immersif
│                                     │
│     Souhaitez-vous connaître        │
│     ce qui vous attend ?            │ ← Question claire
│                                     │
│                                     │
│     ┌───────────────────────┐       │
│     │   RÉVÉLER MON DESTIN   │       │ ← CTA primaire
│     └───────────────────────┘       │   → WF-E9-03c (confirmation
│                                     │     avec params révélés)
│     ┌───────────────────────┐       │
│     │   ACCEPTER L'INCONNU   │       │ ← CTA secondaire
│     └───────────────────────┘       │   → WF-E9-04 (loading,
│                                     │     params masqués)
│                                     │
└─────────────────────────────────────┘
```

### WF-E9-03c — Confirmation aléatoire (paramètres révélés)

S'affiche uniquement si le joueur a choisi "Révéler mon destin" sur WF-E9-03b.

```
┌─────────────────────────────────────┐
│  ←   Aventure aléatoire             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                     │
│     Le destin a choisi pour vous... │ ← Titre immersif
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  📖 Thème                   │    │
│  │     Dark Fantasy            │    │ ← Paramètres révélés
│  │                             │    │
│  │  ⏱️ Durée                   │    │
│  │     Courte (~20 min)        │    │
│  │                             │    │
│  │  ⚖️ Difficulté              │    │
│  │     Exigeante               │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     ┌───────────────────────┐       │
│     │    LANCER L'AVENTURE   │       │ ← CTA primaire
│     └───────────────────────┘       │
│                                     │
│     Retirer les dés                 │ ← Lien → relance le tirage
│                                     │   (nouveaux params affichés)
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- **WF-E9-03b** est l'écran de choix : aucun paramètre n'est visible. Le joueur décide en aveugle
- **"Accepter l'inconnu"** → passe directement au loading (WF-E9-04) avec params masqués. Le joueur découvre l'univers en jeu
- **"Révéler mon destin"** → affiche WF-E9-03c avec les paramètres tirés au sort. Le joueur peut valider ou retirer les dés
- **"Retirer les dés"** (WF-E9-03c) : relance le tirage, les nouveaux paramètres remplacent les précédents
- Ce flow ne s'applique qu'au chemin aléatoire — les chemins personnalisée et template passent par WF-E9-03 standard

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
- Si le joueur a choisi "Accepter l'inconnu" (aléatoire), le récap est remplacé par un message mystérieux (_"Le destin est en marche..."_) — pas de paramètres affichés
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

### WF-E9-06 — Limite d'aventures atteinte

```
┌─────────────────────────────────────┐
│  ←   Nouvelle aventure              │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  ⚠️ Vous avez atteint la    │    │ ← Bandeau d'alerte
│  │  limite de 5 aventures      │    │   (bloquant)
│  │  en cours.                  │    │
│  │                             │    │
│  │  Terminez ou abandonnez     │    │
│  │  une aventure pour en       │    │
│  │  lancer une nouvelle.       │    │
│  │                             │    │
│  │  Vos aventures en cours :   │    │
│  │                             │    │
│  │  ┌───────────────────────┐  │    │
│  │  │ 🔥 La Crypte des      │  │    │ ← Liste des aventures
│  │  │    Ombres        [⋮]  │  │    │   actives avec menu
│  │  ├───────────────────────┤  │    │   contextuel (reprendre
│  │  │ 🌊 Les Marées de      │  │    │   ou abandonner)
│  │  │    Korhal        [⋮]  │  │    │
│  │  ├───────────────────────┤  │    │
│  │  │ 🐉 L'Éveil du Dragon │  │    │
│  │  │                  [⋮]  │  │    │
│  │  ├───────────────────────┤  │    │
│  │  │ 💀 Le Pacte Obscur   │  │    │
│  │  │                  [⋮]  │  │    │
│  │  ├───────────────────────┤  │    │
│  │  │ 🏰 La Tour Maudite   │  │    │
│  │  │                  [⋮]  │  │    │
│  │  └───────────────────────┘  │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  (Configuration masquée —           │ ← L'écran de config n'est
│   inaccessible tant que limite      │   pas scrollable tant que
│   atteinte)                         │   la limite est atteinte
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Max **5 aventures solo** actives simultanément. La limite empêche l'accumulation de contenu inachevé
- Le menu contextuel `[⋮]` sur chaque aventure propose : **Reprendre** (→ E10) ou **Abandonner** (→ modale WF-E9-07)
- La configuration (E9-01) est **bloquée** tant que la limite est atteinte — contrairement à l'ancien bandeau non-bloquant
- Dès qu'une aventure est abandonnée/terminée et que le nombre passe sous 5, le bandeau disparaît et la configuration est accessible

### WF-E9-07 — Modale d'abandon aventure

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
│  │  👤 Profil      │   │                                                │  │
│  │  ⚔️ Aventure    │   │  ┌──────────────────────┐ ┌──────────────────────┐ │
│  │               │   │  │  Combien de temps    │ │  Quel défi           │ │
│  │               │   │  │  avez-vous ?         │ │  souhaitez-vous ?    │ │
│  ├───────────────┤   │  │                      │ │                      │ │
│  │  ⚙️ Paramètres  │   │  │                      │ │                      │ │
│  │  🚪 Déconnexion │   │  │                      │ │                      │ │
│  └───────────────┘   │  │                      │ │                      │ │
│                      │  │ ⚡ Courte   ~20 min   │ │ Facile ━●━━━━━━     │ │
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
- Pas de sélection de thème en P1 (Heroic Fantasy par défaut). P4 : ThemeCards en grille horizontale
- Durée et Difficulté côte à côte en 2 colonnes
- Le CTA est centré en bas de la zone de contenu
- Le contenu tient entièrement dans le viewport sans scroll (pas de scrolling sur desktop)

---

## 6. Interactions et transitions

### Flow par chemin d'accès

```
Hub (ActionCard "Créer")     →  WF-E9-01 (Config) → [Lancer] → WF-E9-03 (Confirmation) → WF-E9-04 (Loading) → E10

Hub (ActionCard "Parcourir") →  WF-E9-02 (Templates) → [Choisir] → WF-E9-03 (Confirmation) → WF-E9-04 (Loading) → E10

Hub (ActionCard "Aléatoire") →  WF-E9-03b (Choix surprise)
                                     │
                              ┌──────┴──────┐
                              │             │
                       [Révéler]     [Accepter l'inconnu]
                              │             │
                              ▼             ▼
                       WF-E9-03c       WF-E9-04
                       (params         (params masqués)
                        révélés)            │
                              │             │
                       [Lancer]             │
                              │             │
                              ▼             │
                       WF-E9-04             │
                       (params visibles)    │
                              │             │
                              └──────┬──────┘
                                     ▼
                                   E10

⚠️ Si 5 aventures solo en cours → WF-E9-06 (limite atteinte) au lieu de la config
```

### Détail des interactions

| Action utilisateur                     | Résultat                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Tap `←` (header)                       | Retour au Hub. Paramètres en cours **non** conservés (pas de brouillon).                            |
| Tap DurationSelector option            | Sélection de la durée (exclusive). Fond accent sur l'option sélectionnée.                           |
| Drag/tap DifficultySlider              | Déplace le curseur. La description sous le slider change dynamiquement.                             |
| Tap "Lancer l'aventure" (E9-01)        | Navigation vers WF-E9-03 (confirmation).                                                            |
| Tap "Choisir" sur TemplateCard (E9-02) | Navigation vers WF-E9-03 (confirmation) avec paramètres du template.                                |
| Tap "Lancer l'aventure" (E9-03)        | Navigation vers WF-E9-04 (loading de génération).                                                   |
| Tap "Modifier les paramètres" (E9-03)  | Retour vers E9-01 ou E9-02 (selon le chemin d'origine). Paramètres conservés.                       |
| Tap "Révéler mon destin" (E9-03b)      | Navigation vers WF-E9-03c (paramètres révélés). Aucun paramètre n'est visible avant ce choix.       |
| Tap "Accepter l'inconnu" (E9-03b)      | Lance directement → WF-E9-04 (loading, params masqués). Le joueur ne voit jamais les paramètres.    |
| Tap "Lancer l'aventure" (E9-03c)       | Lance avec les paramètres aléatoires affichés → WF-E9-04 (loading, params visibles).                |
| Tap "Retirer les dés" (E9-03c)         | Relance le tirage aléatoire. Nouveaux paramètres affichés sur E9-03c.                               |
| Tap `[⋮]` sur aventure (E9-06)         | Menu contextuel : Reprendre (→ E10) ou Abandonner (→ modale WF-E9-07).                              |
| Confirm "Abandonner" (WF-E9-07)        | Aventure archivée (historique, sans récompenses). Si < 5 aventures, la config redevient accessible. |
| Annuler (WF-E9-07)                     | Ferme la modale. Retour à l'écran précédent.                                                        |

---

## 7. Règles de comportement

| Règle                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Valeurs par défaut**         | Durée = Moyenne, Difficulté = Normal (cran 2/4 — label "Normal"). Thème = Heroic Fantasy (unique en P1, pas de sélecteur — P4 : genres additionnels). Le CTA est toujours actif — le joueur peut lancer immédiatement sans rien toucher.                                                                                                                                                                                                                         |
| **Max 5 aventures solo**       | Le joueur peut avoir jusqu'à 5 aventures solo actives simultanément. Au-delà, WF-E9-06 (limite atteinte) bloque la création. Cette limite évite l'accumulation de contenu inachevé. Le multi (P2+) aura son propre compteur séparé.                                                                                                                                                                                                                              |
| **Confirmation**               | Tous les chemins passent par un écran de confirmation avant la génération. Chemins personnalisée/template → WF-E9-03 (récap). Chemin aléatoire → WF-E9-03b (choix surprise) puis éventuellement WF-E9-03c (récap si révélé).                                                                                                                                                                                                                                     |
| **Mode surprise**              | En mode aléatoire, le choix surprise/révéler se fait **avant** toute révélation de paramètres (WF-E9-03b). Si "Accepter l'inconnu", le joueur ne voit jamais les paramètres — ni sur l'écran de choix, ni dans le loading. Il découvre l'univers directement en jeu.                                                                                                                                                                                             |
| **Personnage d'aventure (P1)** | En P1, le personnage d'aventure hérite automatiquement du méta-personnage (nom, race, classe). Si skip tutoriel (pas de race/classe choisie en E7), le serveur attribue les valeurs par défaut (Race = Humain, Classe = Aventurier — cf. architecture data-models §Valeurs par défaut). Le pseudo (toujours défini, cf. E6) sert de nom de personnage. Ces valeurs sont invisibles pour l'utilisateur en P1. **P2** : E14 ajoutera un écran de personnalisation. |
| **Templates**                  | Scénarios pré-configurés côté serveur. Pas de paramètres à choisir — le joueur voit le résumé et lance directement.                                                                                                                                                                                                                                                                                                                                              |
| **Aléatoire**                  | Le système tire au sort thème + durée + difficulté (pondéré vers des valeurs équilibrées). Le joueur passe par WF-E9-03b (choix surprise) puis WF-E9-03c (révélation) ou directement au loading (surprise).                                                                                                                                                                                                                                                      |
| **Génération LLM**             | Retry automatique x2 (invisible). Après 3 échecs, affichage WF-E9-05. Timeout indicatif : 10-15s pour la génération initiale.                                                                                                                                                                                                                                                                                                                                    |
| **Durée et milestones**        | L'utilisateur choisit une durée (Courte ~20 min, Moyenne ~45 min, Longue ~1h+). Le système corrèle en interne au nombre de milestones (2-3, 4-5, 6+). Le nombre de milestones n'est **jamais** affiché.                                                                                                                                                                                                                                                          |
| **Difficulty descriptions**    | Le slider a 4 crans avec descriptions dynamiques correspondant aux noms officiels (GDD §9.1) : 1. _Facile — L'histoire avant le défi. Le MJ est bienveillant, les échecs sont doux._ / 2. _Normal — Équilibre narration et défi. Les erreurs ont des conséquences surmontables._ / 3. _Difficile — Le défi est réel. Les erreurs coûtent cher, restez vigilant._ / 4. _Cauchemar — Survie narrative. Le MJ est impitoyable, chaque erreur peut être fatale._       |
| **Compagnon (P3)**             | Emplacements réservés sur WF-E9-04 (loading : message d'encouragement). En P1, le loading est silencieux.                                                                                                                                                                                                                                                                                                                                                        |

---

**Document généré via BMAD Method — Phase UX Phase 2 (Sally, UX Expert)**
