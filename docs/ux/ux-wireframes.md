# JDRAI - Wireframes UX (Phase 2)

**Version :** 0.1 (draft)
**Date :** 2026-02-06
**Auteur :** Sally (UX Expert, BMAD Method)
**Statut :** En cours
**Références :** `docs/prd.md` v1.3, `docs/ux/ux-cartography.md` v1.1

---

## Table des matières

1. [Décisions de design](#1-décisions-de-design)
2. [E10 — Session de jeu](#2-e10--session-de-jeu)
3. [E8 — Hub](#3-e8--hub) _(à venir)_
4. [E5/E6/E7 — Onboarding](#4-e5e6e7--onboarding) _(à venir)_
5. [E9 — Lancement aventure](#5-e9--lancement-aventure) _(à venir)_
6. [E11 — Écran de fin](#6-e11--écran-de-fin) _(à venir)_
7. [E1/E2 — Auth](#7-e1e2--auth) _(à venir)_

---

## 1. Décisions de design

### 1.1 Décisions transversales

| Décision              | Choix                   | Justification                                                                      |
| --------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| Approche              | Mobile-first            | PRD §5.3 — session de jeu = interaction chat/choix naturellement adaptée au mobile |
| Navigation en session | Sidebar/tab bar masquée | PRD §4.2 F2 — immersion totale pendant le jeu                                      |
| Thème visuel          | Dark fantasy            | UX Cartography §1.1 — tons chauds, textures parchemin, ambiance immersive          |

### 1.2 Structure narrative : Milestones & Events

> **Origine :** Concept issu de la phase de discovery initiale (brainstorming fondateurs). Impacte la structure des aventures et plusieurs écrans (session, hub, lancement, fin).

**Hiérarchie narrative d'une aventure :**

```
AVENTURE "La Crypte des Ombres"
│
├── 🏴 MILESTONE 1 — Réception de la quête
│   ├── ○ Event : Arrivée à la taverne (obligatoire — intro)
│   ├── ○ Event : Rencontre avec le marchand (optionnel)
│   └── ○ Event : Discussion avec l'informateur (optionnel)
│
├── 🏴 MILESTONE 2 — Entrée dans la crypte
│   ├── ○ Event : Exploration de la grotte (optionnel)
│   ├── ○ Event : Piège dans le couloir (optionnel)
│   └── ○ Event : Découverte de la salle principale (obligatoire)
│
├── 🏴 MILESTONE 3 — Confrontation finale
│   ├── ○ Event : Négociation avec le gardien (optionnel)
│   └── ○ Event : Combat final (obligatoire)
│
└── 🏴 MILESTONE 4 — Résolution
    └── ○ Event : Retour et récompenses (obligatoire)
```

| Concept       | Définition                                                                                                                                                 | Obligatoire ?                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Milestone** | Jalon narratif majeur qui structure l'aventure et en prédit la durée. Moment clé et (sauf exception) incontournable.                                       | Oui (sauf exceptions)                                 |
| **Event**     | Rencontre ou situation entre les milestones. Ponctue l'aventure. Le MJ guide le joueur, mais certains choix peuvent éloigner d'un event.                   | Non — certains sont obligatoires, d'autres optionnels |
| **Scène**     | Séquence cohérente d'échanges MJ-joueur avec un début et une fin naturels (ex : parler à un PNJ, explorer une pièce). Plusieurs scènes composent un event. | —                                                     |

**Impact UX :**

| Écran                       | Impact                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| **E10 — Historique**        | Regroupement par milestones (P1), events à l'intérieur (P2+)                              |
| **E9 — Lancement aventure** | Durée estimée corrélée au nombre de milestones (courte = 2-3, longue = 6+)                |
| **E8 — Hub**                | Carte aventure en cours affiche le nom du milestone actuel (pas de progression numérique) |
| **E11 — Écran de fin**      | Récap par milestones atteints (P1), events découverts (P2+)                               |

> **Règle de visibilité** : Jamais de progression numérique ("2/4", "%"). Seul le nom du milestone est affiché. Cf. UX Cartography §7.1 principe 6.

### 1.3 Décisions spécifiques E10

| Décision            | Choix                   | Alternatives écartées                         | Raison                                                                                     |
| ------------------- | ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Paradigme narration | **Scène focalisée**     | Scroll narratif (chat-like), Hybride narratif | Immersion maximale, feeling jeu vidéo plutôt que chatbot                                   |
| Zone d'action       | **Inline + champ fixe** | Zone fixe complète en bas                     | Les choix sont contextuels (liés à la narration), le champ libre reste toujours accessible |
| Menu de jeu         | **Overlay pause**       | Barre flottante d'icônes                      | Renforce l'immersion, distinction claire avec une app classique (feeling menu pause RPG)   |

---

## 2. E10 — Session de jeu

**Route :** `/adventure/:id`
**Priorité :** P1
**Complexité :** Très élevée
**Référence composants :** UX Cartography §5.5

### 2.1 Anatomie de l'écran

```
┌─────────────────────────────────┐
│  SessionHeader                  │ ← Fixe en haut
│  (titre + icône menu pause)     │
├─────────────────────────────────┤
│                                 │
│  NarrationPanel                 │ ← Zone principale, scrollable
│  (scène actuelle uniquement)    │
│                                 │
│  ChoiceList (inline)            │ ← Dans le flux de narration
│  (2-4 ChoiceButtons)            │
│                                 │
├─────────────────────────────────┤
│  FreeInput                      │ ← Fixe en bas
│  (saisie libre + btn historique)│
└─────────────────────────────────┘
```

**Composants impliqués :** SessionHeader, NarrationPanel, ChoiceList, ChoiceButton, FreeInput, StreamingText, LoadingNarration, AutosaveIndicator

### 2.2 Wireframes mobile (< 768px)

#### WF-E10-01 — État par défaut (narration + choix)

```
┌─────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres    [⚙]  │ ← SessionHeader
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │    titre tronqué + icône menu
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  Vous pénétrez dans la      │    │
│  │  taverne enfumée. Un        │    │ ← NarrationPanel
│  │  silence s'installe à       │    │   scrollable si texte long,
│  │  votre arrivée. Le          │    │   style parchemin,
│  │  tavernier vous dévisage    │    │   plein écran
│  │  derrière son comptoir,     │    │
│  │  tandis qu'un groupe de     │    │
│  │  mercenaires dans le coin   │    │
│  │  vous lance des regards     │    │
│  │  hostiles.                  │    │
│  │                             │    │
│  │  Que faites-vous ?          │    │
│  │                             │    │
│  │  ┌───────────────────────┐  │    │
│  │  │ 1. M'approcher du     │  │    │ ← ChoiceButton
│  │  │    comptoir et         │  │    │
│  │  │    commander           │  │    │
│  │  └───────────────────────┘  │    │
│  │  ┌───────────────────────┐  │    │
│  │  │ 2. Chercher une table │  │    │
│  │  │    isolée              │  │    │
│  │  └───────────────────────┘  │    │
│  │  ┌───────────────────────┐  │    │
│  │  │ 3. Affronter le       │  │    │
│  │  │    regard des          │  │    │
│  │  │    mercenaires         │  │    │
│  │  └───────────────────────┘  │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📜│ Écrire votre action...  [➤]│ │ ← FreeInput fixe
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Légende :**

- `[⚙]` : icône thématique menu pause (dé, grimoire, ou bouclier — à définir en phase UI)
- `📜` : bouton historique (ouvre le drawer d'historique)
- `[➤]` : envoi saisie libre
- `AutosaveIndicator` : apparaît brièvement sous le header ("✓ Sauvegardé"), disparaît après 2s

#### WF-E10-02 — Streaming MJ (le MJ écrit)

```
┌─────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres    [⚙]  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  Le tavernier lève un       │    │
│  │  sourcil méfiant tandis     │    │ ← StreamingText
│  │  que vous vous approchez    │    │   texte apparaît
│  │  du comptoir. "On n'a pas   │    │   mot par mot
│  │  l'habitude des étrangers   │    │
│  │  par ici", grommelle-t-il   │    │
│  │  en essuyant une chope█     │    │ ← curseur clignotant
│  │                             │    │
│  │                             │    │
│  │                             │    │
│  │                             │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📜│ Le MJ raconte...       ░░░ │ │ ← Input désactivé
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Notes :**

- `░░░` : indicateur animé (plume qui écrit, encre qui coule — à définir en phase UI)
- Les choix n'apparaissent **pas** pendant le streaming — ils arrivent une fois le texte complet
- L'input est désactivé pour éviter les envois pendant que le MJ écrit

#### WF-E10-03 — Loading MJ (avant le streaming)

```
┌─────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres    [⚙]  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │                             │    │
│  │                             │    │
│  │     ┌─────────────────┐     │    │
│  │     │  ✒️               │     │    │ ← LoadingNarration
│  │     │  Le MJ consulte  │     │    │   animation thématique :
│  │     │  ses parchemins...│     │    │   plume qui écrit,
│  │     │                  │     │    │   dé qui roule,
│  │     │  ···             │     │    │   pages qui tournent
│  │     └─────────────────┘     │    │
│  │                             │    │
│  │                             │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📜│ Patientez...           ░░░ │ │ ← Input désactivé
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Note :** Phase brève avant que le streaming ne commence (temps de réponse API initial). Si le streaming démarre en < 1s, cet état peut ne pas être perçu.

#### WF-E10-04 — Écho du choix joueur (transition)

```
┌─────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres    [⚙]  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  ┌───────────────────────┐  │    │
│  │  │ ▸ Vous vous approchez │  │    │ ← Écho du choix
│  │  │   du comptoir et      │  │    │   bref, stylisé,
│  │  │   commandez une       │  │    │   italique ou
│  │  │   boisson             │  │    │   couleur distincte
│  │  └───────────────────────┘  │    │
│  │                             │    │
│  │  Le tavernier lève un       │    │ ← Nouvelle narration
│  │  sourcil méfiant tandis     │    │   streaming en cours
│  │  que vous vous approchez    │    │
│  │  du comptoir█               │    │
│  │                             │    │
│  │                             │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📜│ Le MJ raconte...       ░░░ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Note :** L'écho rappelle le choix du joueur avant la réponse du MJ. Compense l'absence d'historique visible en mode scène focalisée. Donne du contexte narratif immédiat.

#### WF-E10-05 — Menu pause (overlay)

```
┌─────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓                                   ▓│
│▓            ⚔️ PAUSE               ▓│ ← Titre centré, thématique
│▓                                   ▓│
│▓  ┌───────────────────────────┐    ▓│
│▓  │   💾  Sauvegarder         │    ▓│ ← Sauvegarde manuelle
│▓  └───────────────────────────┘    ▓│
│▓                                   ▓│
│▓  ┌───────────────────────────┐    ▓│
│▓  │   🎭  Paramètres MJ      │    ▓│ ← Ouvre le drawer P2
│▓  └───────────────────────────┘    ▓│   grisé/masqué en P1
│▓                                   ▓│
│▓  ┌───────────────────────────┐    ▓│
│▓  │   📜  Historique          │    ▓│ ← Ouvre le drawer historique
│▓  └───────────────────────────┘    ▓│
│▓                                   ▓│
│▓  ┌───────────────────────────┐    ▓│
│▓  │   🚪  Quitter l'aventure │    ▓│ ← Déclenche confirmation
│▓  └───────────────────────────┘    ▓│
│▓                                   ▓│
│▓         [Reprendre]               ▓│ ← Ferme l'overlay
│▓                                   ▓│
│▓  ✓ Sauvegardé il y a 2 min       ▓│ ← Info discrète
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└─────────────────────────────────────┘
```

**Notes :**

- `▓` : fond sombre semi-transparent, le jeu est flouté en arrière-plan
- Feeling : menu pause de RPG (Skyrim, Baldur's Gate 3)
- Accès via l'icône `[⚙]` du SessionHeader
- **Paramètres MJ** : visible mais grisé en P1 (pas de personnalisation MJ), actif en P2

#### WF-E10-06 — Confirmation de sortie

```
┌─────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓                                   ▓│
│▓                                   ▓│
│▓   ┌───────────────────────────┐   ▓│
│▓   │                           │   ▓│
│▓   │  Quitter l'aventure ?     │   ▓│
│▓   │                           │   ▓│
│▓   │  Votre progression est    │   ▓│
│▓   │  sauvegardée. Vous        │   ▓│
│▓   │  pourrez reprendre à      │   ▓│
│▓   │  tout moment depuis       │   ▓│
│▓   │  le Hub.                  │   ▓│
│▓   │                           │   ▓│
│▓   │  💾 Dernière sauvegarde   │   ▓│
│▓   │  il y a 2 min            │   ▓│
│▓   │                           │   ▓│
│▓   │  ┌─────────────────────┐  │   ▓│
│▓   │  │  Quitter             │  │   ▓│ ← Action destructive
│▓   │  └─────────────────────┘  │   ▓│
│▓   │  ┌─────────────────────┐  │   ▓│
│▓   │  │  Rester              │  │   ▓│ ← Action sûre
│▓   │  └─────────────────────┘  │   ▓│
│▓   │                           │   ▓│
│▓   └───────────────────────────┘   ▓│
│▓                                   ▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└─────────────────────────────────────┘
```

**Déclencheurs :**

- Bouton "Quitter l'aventure" dans le menu pause
- Bouton retour du navigateur
- Navigation vers une autre route (guard)
- `beforeunload` (fermeture onglet / refresh)

#### WF-E10-07 — Drawer historique

```
┌─────────────────────────────────────┐
│  ← Retour               Historique  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🏴 Réception de la quête   │    │ ← Milestone 1
│  │                             │    │
│  │ "Vous arrivez aux portes    │    │
│  │ d'une cité oubliée..."     │    │
│  │ ▸ Franchi les portes        │    │ ← Choix joueur
│  │                             │    │
│  │ "Les gardes vous            │    │
│  │ dévisagent..."              │    │
│  │ ▸ Montré le sceau royal     │    │
│  │                             │    │
│  │ "Un homme vous interpelle   │    │
│  │ depuis son échoppe..."      │    │
│  │ ▸ Acheté une potion         │    │
│  ├─────────────────────────────┤    │
│  │ 🏴 Entrée dans la crypte   │    │ ← Milestone 2
│  │               ● en cours    │    │
│  │                             │    │
│  │ "Le sol se dérobe sous      │    │
│  │ vos pieds..."               │    │
│  │ ▸ Sauté sur le côté         │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Plein écran sur mobile, panneau latéral sur desktop
- **P1** : Regroupement par **milestones** uniquement. Les échanges (narration MJ + choix joueur) s'enchaînent dans le flux sous chaque milestone.
- **P2+** : Ajout du niveau **events** entre milestones et échanges (cf. UX Cartography §2.6)
- Le milestone en cours est marqué `● en cours`
- Les échanges individuels ne sont pas nommés — ils s'enchaînent naturellement
- Lecture seule — le joueur ne peut pas revenir en arrière
- Accessible via le bouton `📜` dans le FreeInput ou via le menu pause

### 2.3 États d'erreur et résilience

#### WF-E10-08 — Perte de connexion

```
┌─────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres    [⚙]  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  ┌─────────────────────────────┐    │
│  │ ⚠️ Connexion perdue          │    │ ← Bandeau non-bloquant
│  │ Reconnexion en cours...     │    │   se rétracte quand OK
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  [Dernière narration MJ     │    │ ← Reste affichée
│  │   toujours visible]         │    │   pas de perte visuelle
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📜│ Reconnexion...         ░░░ │ │ ← Input désactivé
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Comportement :** Auto-reconnexion en arrière-plan. Si réussie → bandeau disparaît, input réactivé. Si échec après X tentatives → bouton "Réessayer" dans le bandeau.

#### WF-E10-09 — Rate limiting (429)

```
┌─────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres    [⚙]  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  [Dernière narration MJ]    │    │
│  │                             │    │
│  │  ┌───────────────────────┐  │    │
│  │  │ 1. Choix A            │  │    │ ← Choix visibles mais
│  │  └───────────────────────┘  │    │   grisés / non-cliquables
│  │  ┌───────────────────────┐  │    │
│  │  │ 2. Choix B            │  │    │
│  │  └───────────────────────┘  │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ⏳ Le MJ reprend son        │    │ ← Message thématique
│  │ souffle... (0:23)           │    │   + compteur visible
│  └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📜│ Patientez (0:23)       🔒 │ │ ← Input verrouillé
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Comportement :** À la fin du compteur → réactivation automatique des choix et du champ de saisie, sans action utilisateur nécessaire.

#### WF-E10-10 — Erreur LLM (timeout / échec)

```
┌─────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres    [⚙]  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │     ┌─────────────────┐     │    │
│  │     │                  │     │    │
│  │     │  Le MJ a renversé│     │    │ ← Message d'erreur
│  │     │  son encrier...  │     │    │   thématique
│  │     │                  │     │    │
│  │     │  ┌────────────┐  │     │    │
│  │     │  │  Réessayer  │  │     │    │ ← Bouton retry
│  │     │  └────────────┘  │     │    │
│  │     │                  │     │    │
│  │     └─────────────────┘     │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📜│ Écrire votre action...  [➤]│ │ ← Input réactivé
│ └─────────────────────────────────┘ │   le joueur peut aussi
└─────────────────────────────────────┘   retenter via saisie libre
```

**Comportement :** Retry auto x3 (invisible pour l'utilisateur) → si toujours en échec → affiche ce state avec bouton retry manuel. L'input est réactivé pour permettre au joueur de reformuler.

### 2.4 Wireframe desktop (> 1024px)

#### WF-E10-11 — Desktop — État par défaut

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres              ✓ Sauvegardé        [⚙ Menu]   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │                                                                  │    │
│  │    Vous pénétrez dans la taverne enfumée. Un silence             │    │
│  │    s'installe à votre arrivée. Le tavernier vous dévisage       │    │
│  │    derrière son comptoir, tandis qu'un groupe de mercenaires    │    │
│  │    dans le coin vous lance des regards hostiles.                │    │
│  │                                                                  │    │
│  │    Les flammes des chandeliers vacillent au rythme d'un         │    │
│  │    courant d'air glacial qui s'engouffre par la porte           │    │
│  │    que vous venez de pousser.                                   │    │
│  │                                                                  │    │
│  │    Que faites-vous ?                                            │    │
│  │                                                                  │    │
│  │    ┌────────────────────────────────────────────────────────┐    │    │
│  │    │  1. M'approcher du comptoir et commander une boisson  │    │    │
│  │    └────────────────────────────────────────────────────────┘    │    │
│  │    ┌────────────────────────────────────────────────────────┐    │    │
│  │    │  2. Ignorer les regards et chercher une table isolée  │    │    │
│  │    └────────────────────────────────────────────────────────┘    │    │
│  │    ┌────────────────────────────────────────────────────────┐    │    │
│  │    │  3. Affronter le regard des mercenaires               │    │    │
│  │    └────────────────────────────────────────────────────────┘    │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  📜 │ Écrire votre action...                              [➤]  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Notes desktop :**

- Même structure que mobile — pas de sidebar, immersion totale
- NarrationPanel centré avec `max-width: ~720px` pour la lisibilité (comme un article/livre)
- AutosaveIndicator visible dans le header (plus d'espace)
- Le menu pause utilise le même overlay que mobile

### 2.5 Interactions et transitions

| Action utilisateur                    | Résultat                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Tap sur un choix                      | Écho du choix (WF-04) → Loading MJ (WF-03) → Streaming (WF-02) → Nouveaux choix (WF-01) |
| Envoi saisie libre                    | Écho du texte (WF-04) → Loading MJ (WF-03) → Streaming (WF-02) → Nouveaux choix (WF-01) |
| Tap `[⚙]`                             | Overlay menu pause (WF-05)                                                              |
| Tap `📜` (dans input)                 | Drawer historique (WF-07)                                                               |
| Tap "Quitter" (menu pause)            | Confirmation de sortie (WF-06)                                                          |
| Swipe back / bouton retour navigateur | Confirmation de sortie (WF-06)                                                          |
| `beforeunload` (fermeture onglet)     | Confirmation navigateur native (limitation technique)                                   |
| Perte de connexion                    | Bandeau reconnexion (WF-08)                                                             |
| HTTP 429                              | Choix grisés + compteur (WF-09)                                                         |
| LLM timeout (après 3 retries auto)    | Message erreur + retry manuel (WF-10)                                                   |

### 2.6 Règles de comportement

| Règle                  | Description                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auto-save**          | Sauvegarde après chaque échange complet (choix joueur + réponse MJ). Indicateur "✓ Sauvegardé" visible 2s.                                      |
| **Streaming**          | Le texte apparaît mot par mot. Les choix n'apparaissent qu'après la fin du streaming.                                                           |
| **Input lock**         | Le FreeInput est désactivé pendant le loading et le streaming. Réactivé une fois les choix affichés.                                            |
| **Écho choix**         | Le choix du joueur est affiché brièvement en haut de la scène avant la nouvelle narration. Reste visible pendant le streaming.                  |
| **Historique**         | Stocké côté client (+ serveur via save). Organisé par milestones → events → échanges (cf. [§1.2](#12-structure-narrative--milestones--events)). |
| **Navigation bloquée** | Aucune navigation hors session sans confirmation. Inclut : liens, bouton retour, refresh, fermeture.                                            |
| **Keyboard desktop**   | Touches 1-4 pour sélectionner un choix. Enter pour envoyer le texte libre. Escape pour ouvrir le menu pause.                                    |

---

## 3. E8 — Hub

_(À venir)_

---

## 4. E5/E6/E7 — Onboarding

_(À venir)_

---

## 5. E9 — Lancement aventure

_(À venir)_

---

## 6. E11 — Écran de fin

_(À venir)_

---

## 7. E1/E2 — Auth

_(À venir)_

---

**Document généré via BMAD Method — Phase UX Phase 2 (Sally, UX Expert)**
