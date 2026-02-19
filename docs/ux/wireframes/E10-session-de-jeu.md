# E10 — Session de jeu

**Route :** `/adventure/:id`  
**Priorité :** P1  
**Complexité :** Très élevée  
**Référence composants :** UX Cartography §5.5  
**Parent :** [`wireframes/README.md`](README.md)

---

## Table des matières

1. [Décisions spécifiques E10](#1-décisions-spécifiques-e10)
2. [Anatomie de l'écran](#2-anatomie-de-lécran)
3. [Wireframes mobile](#3-wireframes-mobile--768px)
4. [États d'erreur et edge cases](#4-états-derreur-et-edge-cases)
5. [Wireframe desktop](#5-wireframe-desktop--1024px)
6. [Interactions et transitions](#6-interactions-et-transitions)
7. [Règles de comportement](#7-règles-de-comportement)

---

## 1. Décisions spécifiques E10

| Décision            | Choix                   | Alternatives écartées                         | Raison                                                                                     |
| ------------------- | ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Paradigme narration | **Scène focalisée**     | Scroll narratif (chat-like), Hybride narratif | Immersion maximale, feeling jeu vidéo plutôt que chatbot                                   |
| Zone d'action       | **Inline + champ fixe** | Zone fixe complète en bas                     | Les choix sont contextuels (liés à la narration), le champ libre reste toujours accessible |
| Menu de jeu         | **Overlay pause**       | Barre flottante d'icônes                      | Renforce l'immersion, distinction claire avec une app classique (feeling menu pause RPG)   |

---

## 2. Anatomie de l'écran

```
┌─────────────────────────────────┐
│  SessionHeader                  │ ← Fixe en haut
│  (titre + icône menu pause)     │
│  CharacterPanel                 │ ← Fixe sous le header (compact)
│  (nom · classe  ❤️ HP/HPmax)    │   Visible dès P1 (GDD GD-006)
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

**Composants impliqués :** SessionHeader, CharacterPanel, NarrationPanel, ChoiceList, ChoiceButton, FreeInput, StreamingText, LoadingNarration, AutosaveIndicator, MilestoneOverlay

---

## 3. Wireframes mobile (< 768px)

### WF-E10-01 — État par défaut (narration + choix)

```
┌─────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres    [⚙]  │ ← SessionHeader
│  🧙 Aldric · Aventurier  ❤️ 18/20 │ ← CharacterPanel (compact, fixe)
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │    séparateur
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

### WF-E10-02 — Streaming MJ (le MJ écrit)

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

### WF-E10-03 — Loading MJ (avant le streaming)

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

### WF-E10-04 — Écho du choix joueur (transition)

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

### WF-E10-05 — Menu pause (overlay)

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

### WF-E10-06 — Confirmation de sortie

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

### WF-E10-07 — Drawer historique

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

### WF-E10-12 — Milestone atteint (overlay célébration)

> **Source** : GDD §10.2 — Célébrations UX P1

Overlay affiché brièvement (2-3 secondes) lorsque le MJ signale `[MILESTONE_COMPLETE:nom]`. S'affiche par-dessus la narration, puis fond enchaîne vers la suite.

```
┌─────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres    [⚙]  │
│  🧙 Aldric · Aventurier  ❤️ 18/20 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ ← Fond assombri semi-transparent
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   (la narration reste visible
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │   en arrière-plan, floutée)
│  ░░░░                         ░░░░  │
│  ░░░  ✦ Entrée dans la crypte ✦  ░░│ ← Nom du milestone
│  ░░░                           ░░░  │   texte doré, centré
│  ░░░  Un nouveau chapitre      ░░░  │ ← Sous-titre court (optionnel)
│  ░░░  commence...              ░░░  │   style RPG classique
│  ░░░░                         ░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Durée d'affichage : 2-3 secondes. Disparaît automatiquement (fade-out) — pas de clic requis
- Le joueur ne peut pas interagir pendant l'overlay (input déjà désactivé pendant le streaming)
- Le nom du milestone provient directement du champ `Milestone.name` (stocké en base)
- **Pas d'overlay** pour le premier milestone (il est activé dès le lancement — pas une transition)
- **P2** : L'overlay pourrait être désactivable dans les paramètres MJ

### WF-E10-13 — Introduction d'aventure (premier affichage de session)

> **Source** : GDD §10.2 — Célébrations UX P1

Lors du **premier affichage** de la session (transition depuis E9-04 loading), avant la première narration du MJ, un texte d'introduction apparaît en fade-in progressif. Remplace l'état loading et s'enchaîne vers WF-E10-01.

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│     Il était une fois...            │ ← Texte d'introduction
│                                     │   fade-in progressif, mot par mot
│     une âme en quête d'aventure.    │   style "Il était une fois..."
│                                     │   typographie immersive, centrée
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Plein écran, navigation masquée (même état que le loading E9-04)
- Le texte est court (1-2 phrases) — généré par le MJ IA dans sa première réponse, ou fixe P1
- S'enchaîne automatiquement vers le streaming de la première narration MJ (WF-E10-02)
- Ne s'affiche que lors du **premier lancement** — pas lors de la reprise d'une aventure sauvegardée
- **P3** : Le compagnon pourrait intervenir ici avant de laisser place au MJ

---

## 4. États d'erreur et edge cases

### WF-E10-08 — Perte de connexion

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

### WF-E10-09 — Rate limiting (429)

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

### WF-E10-10 — Erreur LLM (timeout / échec)

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

---

## 5. Wireframe desktop (> 1024px)

### WF-E10-11 — Desktop — État par défaut

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ⚔️ La Crypte des Ombres   🧙 Aldric · Aventurier  ❤️ 18/20   ✓ Sauvegardé   [⚙ Menu]  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
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

---

## 6. Interactions et transitions

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

---

## 7. Règles de comportement

| Règle                  | Description                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Auto-save**          | Sauvegarde après chaque échange complet (choix joueur + réponse MJ). Indicateur "✓ Sauvegardé" visible 2s.                            |
| **Streaming**          | Le texte apparaît mot par mot. Les choix n'apparaissent qu'après la fin du streaming.                                                 |
| **Input lock**         | Le FreeInput est désactivé pendant le loading et le streaming. Réactivé une fois les choix affichés.                                  |
| **Écho choix**         | Le choix du joueur est affiché brièvement en haut de la scène avant la nouvelle narration. Reste visible pendant le streaming.        |
| **Historique**         | Stocké côté client (+ serveur via save). Organisé par milestones → events → échanges (cf. wireframes/README.md §Milestones & Events). |
| **Navigation bloquée** | Aucune navigation hors session sans confirmation. Inclut : liens, bouton retour, refresh, fermeture.                                  |
| **Keyboard desktop**   | Touches 1-4 pour sélectionner un choix. Enter pour envoyer le texte libre. Escape pour ouvrir le menu pause.                          |
| **CharacterPanel**     | Bande fixe compacte sous le SessionHeader. Affiche : nom · classe · ❤️ currentHp/maxHp. Mise à jour en temps réel quand le GameService reçoit un signal `[HP_CHANGE:x]` du LLM. En P2, s'enrichira (stats, équipement). Source : GDD GD-006. |
| **Milestone overlay**  | Quand le MJ émet `[MILESTONE_COMPLETE:nom]`, un overlay "titre doré sur fond assombri" s'affiche 2-3 secondes (WF-E10-12). Disparaît automatiquement, enchaîne vers la narration suivante. P1. |
| **Intro session**      | Au premier lancement d'une nouvelle aventure (pas à la reprise), un texte fade-in court s'affiche avant la première narration MJ (WF-E10-13). Style "Il était une fois...". P1. |

---

**Document généré via BMAD Method — Phase UX Phase 2 (Sally, UX Expert)**
