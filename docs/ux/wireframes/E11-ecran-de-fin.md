# E11 — Écran de fin

**Route :** `/adventure/:id/summary`
**Priorité :** P1
**Complexité :** Moyenne
**Référence composants :** UX Cartography §5.7
**Parent :** [`wireframes/README.md`](README.md)

---

## Table des matières

1. [Décisions spécifiques Écran de fin](#1-décisions-spécifiques-écran-de-fin)
2. [Anatomie de l'écran](#2-anatomie-de-lécran)
3. [Wireframes mobile (< 768px)](#3-wireframes-mobile--768px)
4. [États d'erreur et edge cases](#4-états-derreur-et-edge-cases)
5. [Wireframes desktop (> 1024px)](#5-wireframes-desktop--1024px)
6. [Interactions et transitions](#6-interactions-et-transitions)
7. [Règles de comportement](#7-règles-de-comportement)

---

## 1. Décisions spécifiques Écran de fin

| Décision          | Choix                                                         | Alternatives écartées          | Raison                                                                                                             |
| ----------------- | ------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Ton               | **Célébration narrative (succès) / Solennel épique (game over)** | Tableau de bord / stats brutes | Prolonger l'immersion jusqu'au bout. La fin d'aventure est un moment émotionnel, pas un rapport. Le ton varie selon l'issue (GDD §6.3). |
| Structure         | **Scroll vertical : résumé → milestones → récompenses → CTA** | Onglets / carousel             | Un flow linéaire de haut en bas crée une montée en puissance naturelle (récit → accomplissements → gratification). |
| Milestones        | **Récap par milestones atteints (P1)**                        | Récap chronologique brut       | Les milestones structurent le récapitulatif. Events découverts ajoutés en P2+.                                     |
| XP et récompenses | **Animation de gain visible (succès) / Placeholder P1 (game over & succès)**  | Affichage statique | L'animation renforce le sentiment d'accomplissement. En P2 : XP complète pour succès, XP réduite pour game over, aucune XP pour abandon (GDD §6.4). |
| Sidebar / Tab bar | **Visibles**                                                  | Masquées                       | L'aventure est terminée — le joueur retrouve la navigation libre.                                                  |
| Accès ultérieur   | **Accessible depuis l'historique du Hub**                     | Page éphémère                  | Le joueur peut revoir le résumé de ses aventures passées. URL persistante (`/adventure/:id/summary`).              |

---

## 2. Anatomie de l'écran

```
┌─────────────────────────────────┐
│  Aventure terminée !            │ ← Header célébration
├─────────────────────────────────┤
│                                 │
│  SummaryCard (résumé narratif)  │ ← Texte généré par le MJ
│                                 │
│  Milestones atteints            │ ← Liste des jalons
│                                 │
│  Récompenses                    │ ← XP + succès + cosmétiques
│                                 │
│  [CTA Retour au Hub]            │
│                                 │
└─────────────────────────────────┘
```

**Composants :** SummaryCard, MilestoneRecap, RewardList, XPGainAnimation, ReturnToHubCTA, Bouton secondaire

---

## 3. Wireframes mobile (< 768px)

### WF-E11-01 — Écran de fin (état principal)

```
┌─────────────────────────────────────┐
│                                     │
│              🎉                     │ ← Animation de célébration
│                                     │   (confettis / éclat doré)
│     Aventure terminée !             │
│                                     │
│     "La Crypte des Ombres"          │ ← Nom de l'aventure
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  📜 Résumé de l'aventure    │    │ ← SummaryCard
│  │                             │    │   texte narratif généré
│  │  Vous avez bravé les       │    │   par le MJ en fin de
│  │  profondeurs de la crypte,  │    │   session (2-4 phrases)
│  │  déjoué les pièges de      │    │
│  │  l'ancien gardien et       │    │
│  │  ramené la relique au      │    │
│  │  village. Les habitants    │    │
│  │  vous acclament.           │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     Votre parcours                  │ ← Titre section milestones
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🏴 Réception de la quête   │    │ ← MilestoneRecap
│  │     ✓                       │    │   nom + check
│  ├─────────────────────────────┤    │
│  │  🏴 Entrée dans la crypte   │    │
│  │     ✓                       │    │
│  ├─────────────────────────────┤    │
│  │  🏴 Confrontation finale    │    │
│  │     ✓                       │    │
│  ├─────────────────────────────┤    │
│  │  🏴 Résolution              │    │
│  │     ✓                       │    │
│  └─────────────────────────────┘    │
│                                     │
│     Récompenses                     │ ← Titre section récompenses
│                                     │   **P2 — placeholder en P1**
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  ⭐ Expérience              │    │ ← XPGainAnimation (P2)
│  │  ░░░░░░░░░░░░░░░░░░         │    │   P1 : section masquée ou
│  │  Bientôt disponible...      │    │   message "Bientôt disponible"
│  │                             │    │
│  ├─────────────────────────────┤    │
│  │  🏆 Succès                  │    │ ← RewardList (P2)
│  │                             │    │   P1 : section masquée ou
│  │  Les succès arrivent        │    │   placeholder discret
│  │  bientôt !                  │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     ┌───────────────────────┐       │
│     │   RETOUR AU HUB       │       │ ← CTA primaire
│     └───────────────────────┘       │
│                                     │
│     Rejouer ce scénario             │ ← Lien secondaire
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Le scroll suit un arc narratif : célébration → récit → parcours → gratification → action
- L'animation de célébration se joue une seule fois à l'arrivée sur l'écran
- Le SummaryCard contient un texte narratif généré par le MJ (pas un tableau de stats)
- Les milestones sont listés dans l'ordre avec un check — pas de numérotation (règle de visibilité : jamais "2/4")
- **P1** : La section récompenses est un **placeholder** (message "Bientôt disponible" ou section masquée). L'implémentation XP + succès arrive en P2 avec le méta-personnage complet
- **P2** : La barre XP se remplit avec une animation fluide (XPGainAnimation), les succès sont affichés avec badges
- "Rejouer ce scénario" relance une aventure avec les mêmes paramètres (nouveau seed narratif)

### WF-E11-02 — Écran de fin — Game Over

> **Source** : GDD §6.2-§6.3 — État déclenché par `[GAME_OVER]` en difficulté Hard ou Nightmare

Affiché quand l'aventure se termine par un **échec en jeu** (HP à 0 sans sauvetage, choix catastrophique irréversible). Statut aventure = `completed` — pas `abandoned`. Ton solennel, épique, jamais humiliant (GDD §6.3).

```
┌─────────────────────────────────────┐
│                                     │
│              ☠️                      │ ← Icône solennelle
│                                     │   (pas d'animation festive)
│     Votre quête s'achève ici.       │ ← Titre solennel (GDD §6.3)
│                                     │
│     "La Crypte des Ombres"          │ ← Nom de l'aventure
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  📜 Votre héritage          │    │ ← SummaryCard (ton solennel)
│  │                             │    │   texte généré par le MJ :
│  │  La crypte a réclamé votre  │    │   épique, pas humiliant.
│  │  courage. Vous avez bravé   │    │   Ex : "Votre quête s'achève
│  │  l'obscurité jusqu'à vos    │    │   ici, mais votre légende ne
│  │  dernières forces. Votre    │    │   fait que commencer..."
│  │  légende ne fait que        │    │
│  │  commencer...               │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     Votre parcours                  │ ← Milestones atteints avant l'échec
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🏴 Réception de la quête ✓ │    │ ← MilestoneRecap
│  ├─────────────────────────────┤    │   (uniquement les milestones
│  │  🏴 Entrée dans la crypte ✓ │    │   atteints — pas de spoil
│  └─────────────────────────────┘    │   sur ceux non atteints)
│                                     │
│     Récompenses                     │ ← P2 : XP réduite (récompenser
│                                     │   l'effort — GDD §6.3)
│  ┌─────────────────────────────┐    │   P1 : placeholder discret
│  │                             │    │
│  │  ⭐ Expérience              │    │
│  │  Bientôt disponible...      │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     ┌───────────────────────┐       │
│     │   RETOUR AU HUB       │       │ ← CTA primaire
│     └───────────────────────┘       │
│                                     │
│     Retenter ce scénario            │ ← Lien secondaire
│                                     │   (relance, nouveau seed)
│                                     │
└─────────────────────────────────────┘
```

**Différences clés vs WF-E11-01 (succès) :**

| | Succès (E11-01) | Game Over (E11-02) |
|---|---|---|
| **Icône** | 🎉 (animation confettis) | ☠️ (statique, sobre) |
| **Titre** | "Aventure terminée !" | "Votre quête s'achève ici." |
| **Ton résumé** | Triomphant | Solennel, épique, jamais humiliant |
| **Milestones** | Tous (atteints ✓) | Atteints avant l'échec seulement |
| **Récompenses P2** | XP complète | XP réduite (effort récompensé) |
| **Statut aventure** | `completed` | `completed` |
| **CTA secondaire** | "Rejouer ce scénario" | "Retenter ce scénario" |

**Notes :**

- Le nom du résumé côté MJ change de label : **"Votre héritage"** au lieu de "Résumé de l'aventure" — renforce le ton épique sans humilier
- Les milestones non atteints sont **masqués** (pas de spoil si le joueur retente)
- La section récompenses existe (P1 placeholder) — contrairement à l'abandon (WF-E11-05) qui n'a aucune récompense. En P2, l'XP réduite récompense l'effort (GDD §6.4)
- Ce state est uniquement déclenché par un échec en Hard/Nightmare. Easy/Normal utilisent toujours WF-E11-01 (fail forward garanti — GDD GD-002)

---

### WF-E11-03 — Skeleton loading

```
┌─────────────────────────────────────┐
│                                     │
│              🎉                     │ ← Animation jouée immédiatement
│                                     │   (ne dépend pas du chargement)
│     Aventure terminée !             │
│                                     │
│     "La Crypte des Ombres"          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░   │    │ ← Skeleton SummaryCard
│  │  ░░░░░░░░░░░░░░░░░░░       │    │   le résumé est généré
│  │  ░░░░░░░░░░░░░░░░░░░░░░░   │    │   par le LLM (peut prendre
│  │  ░░░░░░░░░░░░░░░            │    │   quelques secondes)
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     Votre parcours                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ░░░░░░░░░░░░░░░░           │    │ ← Skeleton milestones
│  ├─────────────────────────────┤    │   (structure connue,
│  │  ░░░░░░░░░░░░░░░░           │    │   contenu en chargement)
│  ├─────────────────────────────┤    │
│  │  ░░░░░░░░░░░░░░░░           │    │
│  └─────────────────────────────┘    │
│                                     │
│     Récompenses                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ░░░░░░░░░░░░░░░░           │    │ ← Skeleton récompenses
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- L'animation de célébration et le titre s'affichent immédiatement (pas de dépendance serveur)
- Le nom de l'aventure est connu localement (affiché instantanément)
- Les skeletons montrent la structure attendue pour réduire le layout shift
- Les données arrivent en cascade : milestones (rapide, en base) → récompenses (calcul côté serveur) → résumé narratif (LLM, le plus lent)

---

## 4. États d'erreur et edge cases

### WF-E11-04 — Erreur de chargement du résumé

```
┌─────────────────────────────────────┐
│                                     │
│              🎉                     │
│                                     │
│     Aventure terminée !             │
│                                     │
│     "La Crypte des Ombres"          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  ⚠️ Le résumé n'a pas pu    │    │ ← Erreur inline
│  │  être généré.               │    │   dans le SummaryCard
│  │                             │    │
│  │  Réessayer                  │    │ ← Lien retry
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     Votre parcours                  │ ← Le reste de l'écran
│     (milestones affichés)           │   fonctionne normalement
│                                     │
│     Récompenses                     │
│     (XP + succès affichés)          │
│                                     │
│     ┌───────────────────────┐       │
│     │   RETOUR AU HUB       │       │
│     └───────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- L'erreur ne concerne que le résumé narratif (dépendant du LLM)
- Les milestones et récompenses sont indépendants (données en base) et s'affichent normalement
- Le retry ne recharge que le résumé, pas toute la page
- L'écran reste fonctionnel même sans résumé — la gratification (XP, succès) est préservée

### WF-E11-05 — Aventure abandonnée (accès depuis historique)

Quand le joueur consulte le résumé d'une aventure **abandonnée** (non terminée normalement) :

```
┌─────────────────────────────────────┐
│                                     │
│     Aventure inachevée              │ ← Pas de célébration
│                                     │   ton neutre
│     "La Crypte des Ombres"          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  📜 Vous avez quitté cette  │    │ ← SummaryCard adapté
│  │  aventure avant sa          │    │   texte court, factuel
│  │  conclusion.                │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     Votre parcours                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🏴 Réception de la quête ✓ │    │ ← Seuls les milestones
│  ├─────────────────────────────┤    │   atteints sont affichés
│  │  🏴 Entrée dans la crypte ✓ │    │   (les non atteints sont
│  └─────────────────────────────┘    │   masqués — pas de spoil)
│                                     │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    │
│    "Cette histoire avait encore     │ ← Teaser narratif (MJ)
│    des chemins inexplorés..."  │    │   texte statique (P1)
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘    │   invite à retenter
│                                     │
│     Pas de récompenses              │ ← Section récompenses
│     pour cette aventure.            │   absente ou message explicite
│                                     │
│     ┌───────────────────────┐       │
│     │   RETOUR AU HUB       │       │
│     └───────────────────────┘       │
│                                     │
│     Retenter ce scénario            │ ← Relancer avec mêmes params
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Pas d'animation de célébration ni d'emoji festif
- Le titre change : "Aventure inachevée" au lieu de "Aventure terminée !"
- Seuls les milestones **atteints** sont affichés — les milestones non atteints sont **masqués** pour éviter le spoil si le joueur retente l'aventure, et pour ne pas dégrader l'expérience avec un sentiment d'échec
- Un **teaser narratif** statique (P1) est affiché sous les milestones : _"Cette histoire avait encore des chemins inexplorés..."_ — ton du MJ, invite à la curiosité sans spoiler. En P2+, ce texte pourra être généré par le LLM pour être contextuel à l'aventure
- Pas de récompenses XP ni succès pour une aventure abandonnée
- Le CTA "Retenter ce scénario" permet de relancer la même aventure

### WF-E11-06 — Erreur backend (chargement global)

Quand le backend retourne une erreur (500, timeout, données corrompues) et qu'aucune donnée n'est disponible :

```
┌─────────────────────────────────────┐
│                                     │
│              ⚠️                      │
│                                     │
│     Impossible de charger           │ ← Titre erreur
│     le résumé de l'aventure.        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  Une erreur est survenue.   │    │ ← Message d'erreur
│  │  Vos données d'aventure    │    │   rassurant (pas de perte)
│  │  ne sont pas perdues.      │    │
│  │                             │    │
│  │  ┌───────────────────────┐ │    │
│  │  │      RÉESSAYER        │ │    │ ← CTA retry
│  │  └───────────────────────┘ │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     ┌───────────────────────┐       │
│     │   RETOUR AU HUB       │       │ ← CTA secondaire
│     └───────────────────────┘       │   (toujours accessible)
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Différent de WF-E11-04 (erreur LLM uniquement) : ici **aucune donnée** n'est disponible (milestones, récompenses, résumé)
- Le message rassure le joueur : ses données ne sont pas perdues
- Le retry recharge toute la page
- Le CTA "Retour au Hub" est toujours accessible — le joueur ne reste jamais bloqué
- Pas d'animation de célébration (les données ne sont pas chargées)

---

## 5. Wireframes desktop (> 1024px)

### WF-E11-07 — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌───────────────┐                                                           │
│  │  JDRAI         │   🎉 Aventure terminée !                                 │
│  ├───────────────┤   "La Crypte des Ombres"                                  │
│  │  🏠 Hub         │                                                           │
│  │  👤 Profil      │   ┌────────────────────────────────────────────────────┐  │
│  │  ⚔️ Aventure    │   │                                                    │  │
│  │               │   │  COLONNE GAUCHE          │  COLONNE DROITE          │  │
│  │               │   │                          │                          │  │
│  │               │   │  📜 Résumé               │  Votre parcours          │  │
│  │               │   │                          │                          │  │
│  │               │   │  Vous avez bravé les     │  🏴 Réception quête  ✓   │  │
│  │               │   │  profondeurs de la       │  🏴 Entrée crypte    ✓   │  │
│  │               │   │  crypte, déjoué les      │  🏴 Confrontation   ✓   │  │
│  │               │   │  pièges de l'ancien      │  🏴 Résolution      ✓   │  │
│  │               │   │  gardien et ramené la    │                          │  │
│  │               │   │  relique au village.     │                          │  │
│  ├───────────────┤   │                          │                          │  │
│  │  ⚙️ Paramètres  │   ├──────────────────────────┴──────────────────────────┤  │
│  │  🚪 Déconnexion │   │                                                    │  │
│  └───────────────┘   │  Récompenses (P2 — placeholder en P1)               │  │
│                      │                                                    │  │
│                      │  ⭐ XP — Bientôt disponible    │  🏆 Succès — P2    │  │
│                      │                                │                    │  │
│                      │                                                    │  │
│                      │        ┌───────────────────────────┐               │  │
│                      │        │     RETOUR AU HUB         │               │  │
│                      │        └───────────────────────────┘               │  │
│                      │        Rejouer ce scénario                         │  │
│                      │                                                    │  │
│                      └────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Notes :**

- Sidebar visible (navigation libre)
- Layout en 2 colonnes : résumé narratif à gauche, milestones à droite
- Récompenses en bande pleine largeur sous les 2 colonnes (XP à gauche, succès à droite)
- Le CTA et le lien secondaire sont centrés en bas
- L'animation de célébration est au-dessus du contenu (dans le header)

---

## 6. Interactions et transitions

### Flow d'accès

```
E10 (Session) ──[ADVENTURE_COMPLETE]──────────────────────► WF-E11-01 (Succès)
                                                                    │
E10 (Session) ──[GAME_OVER] (Hard/Nightmare)──────────────► WF-E11-02 (Game Over)
                                                                    │
                                               ┌────────────────────┘
                                     ┌─────────┴──────────┐
                                     │                     │
                              [Retour au Hub]    [Rejouer / Retenter]
                                     │                     │
                                     ▼                     ▼
                                Hub (E8)           E9-04 (Loading)
                                                   mêmes paramètres
                                                        │
                                                        ▼
                                                   E10 (Session)

Hub (Historique) ──[Tap carte aventure]──► E11 (consultation)
```

### Détail des interactions

| Action utilisateur                       | Résultat                                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Arrivée sur E11 depuis E10 (succès)      | Animation de célébration jouée. Données chargées en cascade (titre instantané → milestones → récompenses → résumé LLM). Affiche WF-E11-01. |
| Arrivée sur E11 depuis E10 (game over)   | Pas d'animation de célébration. Icône solennelle, titre "Votre quête s'achève ici." Affiche WF-E11-02.                                |
| Scroll vers le bas                       | Découverte progressive : résumé → milestones → récompenses → CTA. L'animation XP se déclenche quand la section entre dans le viewport. |
| Tap "Retour au Hub"                      | Navigation vers E8. L'aventure est archivée dans l'historique.                                                                         |
| Tap "Rejouer ce scénario"                | Navigation vers WF-E9-04 (loading) avec les mêmes paramètres (thème, durée, difficulté). Nouveau seed narratif.                        |
| Tap "Réessayer" (WF-E11-04)              | Relance uniquement la génération du résumé narratif. Le reste de la page reste intact.                                                 |
| Tap "Réessayer" (WF-E11-06)              | Recharge toute la page (erreur backend globale). Succès → affichage normal. Échec → reste sur WF-E11-06.                               |
| Tap carte aventure depuis historique Hub | Navigation vers E11 en mode consultation (pas d'animation de célébration, données déjà en cache).                                      |

---

## 7. Règles de comportement

| Règle                   | Description                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Animation unique**    | L'animation de célébration ne se joue qu'à la première visite (arrivée depuis E10). Les visites ultérieures (depuis l'historique) affichent directement le contenu statique.                                                                                                                     |
| **Résumé narratif**     | Généré par le LLM en fin de session. Texte immersif de 2-4 phrases résumant les moments clés. Si la génération échoue, le reste de l'écran fonctionne normalement (cf. WF-E11-04).                                                                                                               |
| **Milestones (P1)**     | Listés dans l'ordre narratif avec un marqueur ✓. Pas de numérotation, pas de progression numérique. En cas d'abandon, seuls les milestones atteints sont affichés (les non atteints sont masqués pour éviter le spoil).                                                                          |
| **Events (P2+)**        | En P2, les events découverts seront affichés sous chaque milestone (détail dépliable). En P1, seuls les milestones sont visibles.                                                                                                                                                                |
| **XP et succès**        | **P2** : L'XP est calculée côté serveur à la fin de l'aventure. L'animation de la barre se déclenche au scroll (intersection observer). Les succès sont des badges avec icône + nom + description courte. **P1** : Section placeholder (masquée ou message "Bientôt disponible").                |
| **Game Over**           | Déclenché par `[GAME_OVER]` ou `[ADVENTURE_COMPLETE]` + contexte d'échec en Hard/Nightmare. Statut aventure = `completed` (pas `abandoned`). Affiche WF-E11-02 : icône ☠️, titre solennel "Votre quête s'achève ici.", résumé épique (jamais humiliant), milestones atteints avant l'échec, placeholder récompenses (P2 : XP réduite — récompenser l'effort). Pas de "Rejouer" immédiat mais "Retenter ce scénario". |
| **Aventure abandonnée** | Ton neutre (pas de célébration). Seuls les milestones atteints sont affichés (pas de spoil). Teaser narratif statique sous les milestones : _"Cette histoire avait encore des chemins inexplorés..."_ (P1 statique, P2+ généré LLM). Pas de récompenses. CTA "Retenter" au lieu de "Rejouer". Affiche WF-E11-05. |
| **Erreur backend**      | Si le backend est en erreur (500, timeout), afficher WF-E11-06 (erreur globale). Le joueur peut retry ou retourner au Hub. Différent de WF-E11-04 (erreur LLM seule).                                                                                                                            |
| **Rejouer**             | Relance une aventure avec les mêmes paramètres mais un seed narratif différent. Le joueur ne revit pas la même histoire.                                                                                                                                                                         |
| **Persistance**         | L'écran est accessible indéfiniment depuis l'historique du Hub (URL persistante). Les données sont stockées en base, pas éphémères.                                                                                                                                                              |
| **Multijoueur (P2+)**   | En P1, l'écran de fin est solo uniquement. En P2, prévoir des adaptations : récap des contributions par joueur, moments clés collectifs, récompenses individuelles vs collectives, CTA "Rejouer ensemble". L'architecture doit anticiper ces variantes dès P1 (structure de données extensible). |
| **Compagnon (P3)**      | Emplacement réservé entre les récompenses et le CTA. Message de félicitations personnalisé (_"Pas mal ! J'ai noté ça dans vos annales."_). En P1, cet espace est vide.                                                                                                                           |

---

**Document généré via BMAD Method — Phase UX Phase 2 (Sally, UX Expert)**
