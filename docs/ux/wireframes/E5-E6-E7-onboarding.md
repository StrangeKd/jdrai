# E5/E6/E7 — Onboarding

**Routes :** `/onboarding/welcome` (E5), `/onboarding/profile-setup` (E6), `/onboarding/tutorial` (E7)  
**Priorité :** P1  
**Complexité :** Élevée (E5 faible, E6 moyenne, E7 élevée)  
**Référence composants :** UX Cartography §5.3  
**Parent :** [`wireframes/README.md`](README.md)

---

## Table des matières

1. [Décisions spécifiques Onboarding](#1-décisions-spécifiques-onboarding)
2. [Anatomie des écrans](#2-anatomie-des-écrans)
3. [Wireframes mobile (< 768px)](#3-wireframes-mobile--768px)
4. [États d'erreur et edge cases](#4-états-derreur-et-edge-cases)
5. [Wireframes desktop (> 1024px)](#5-wireframes-desktop--1024px)
6. [Interactions et transitions](#6-interactions-et-transitions)
7. [Règles de comportement](#7-règles-de-comportement)

---

## 1. Décisions spécifiques Onboarding

| Décision            | Choix                                       | Alternatives écartées            | Raison                                                                                       |
| ------------------- | ------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| Ton                 | **Narratif/immersif**                       | Formulaire fonctionnel classique | Le joueur entre dans l'univers dès la première seconde. Cohérent avec le thème dark fantasy. |
| Navigation          | **Linéaire, pas de retour**                 | Navigation libre avec back       | Flow dirigé, simple, pas de confusion. L'onboarding est un tunnel.                           |
| Skip tutoriel       | **Proposé à la fin de E6**                  | Partout / nulle part             | Avant E7 = choix éclairé. Pendant E7 = quitter via menu pause (mécanisme E10).               |
| Création personnage | **Contextuelle dans la narration (E7)**     | Formulaire séparé avant le jeu   | Le tutoriel EST le jeu. La création se fait en jouant, pas en remplissant un formulaire.     |
| StepIndicator       | **Dots subtils (E6 uniquement)**            | Numéroté / texte / partout       | Rassure sur la brièveté. Absent sur E5 (splash) et E7 (mode jeu immersif).                   |
| Sidebar / Tab bar   | **Masquées**                                | Visibles                         | Flow linéaire, pas de navigation libre (cf. UX Cartography §3.2).                            |
| Durée cible         | **< 2 min avant la première action de jeu** | Plus long                        | E5 (~15s) + E6 (~45s) = ~1 min avant d'entrer en E7. Réduit le risque de drop-off (§7.3).    |

---

## 2. Anatomie des écrans

### 2.1 E5 — Bienvenue

```
┌─────────────────────────────────┐
│                                 │
│  [Illustration héroïque]        │ ← Ambiance, plein écran
│                                 │
│  Texte d'accueil immersif       │
│                                 │
│  [CTA "Entrer"]                 │
│                                 │
└─────────────────────────────────┘
```

**Composants :** WelcomeHero, Bouton primaire

### 2.2 E6 — Setup profil

```
┌─────────────────────────────────┐
│  ● ○  (StepIndicator)          │
│                                 │
│  Question narrative             │
│  [Input pseudo]                 │
│  [CTA Continuer]                │
│                                 │
│  ── puis ──                     │
│                                 │
│  ○ ●  (StepIndicator)          │
│  Confirmation + NarrativeBox    │
│  [CTA "C'est parti !"]         │
│  Lien skip discret              │
│                                 │
└─────────────────────────────────┘
```

**Composants :** StepIndicator, Input texte, NarrativeBox, Bouton primaire, SkipButton

### 2.3 E7 — Tutoriel (= E10 + layer guidé)

```
┌─────────────────────────────────┐
│  SessionHeader                  │ ← Hérité de E10
├─────────────────────────────────┤
│                                 │
│  NarrationPanel                 │ ← Hérité de E10
│                                 │
│  PresetSelector                 │ ← SPÉCIFIQUE : remplace ChoiceButtons
│  (pour race / classe)           │   lors des moments de création perso
│                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    │
│  │ TutorialTooltip          │    │ ← SPÉCIFIQUE : bulles de guidage
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘    │   aux moments clés
│                                 │
├─────────────────────────────────┤
│  FreeInput                      │ ← Hérité de E10
└─────────────────────────────────┘
```

**Composants hérités de E10 :** SessionHeader, NarrationPanel, ChoiceList, ChoiceButton, FreeInput, StreamingText, LoadingNarration

**Composants spécifiques E7 :** TutorialTooltip, PresetSelector, TutorialEndCard

---

## 3. Wireframes mobile (< 768px)

### E5 — Bienvenue

#### WF-E5-01 — Écran d'accueil

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│        ┌───────────────────┐        │
│        │                   │        │
│        │   [Illustration   │        │ ← WelcomeHero
│        │    héroïque       │        │   ambiance dark fantasy
│        │    JDRAI]         │        │   logo intégré à l'image
│        │                   │        │
│        └───────────────────┘        │
│                                     │
│                                     │
│    Votre aventure commence ici.     │
│                                     │
│    Un Maître du Jeu propulsé        │ ← Texte bref, immersif
│    par l'IA vous attend pour        │   pas de jargon technique
│    des quêtes sur mesure.           │
│                                     │
│                                     │
│    ┌───────────────────────┐        │
│    │        ENTRER          │        │ ← CTA primaire
│    └───────────────────────┘        │   verbe immersif
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Plein écran, aucune navigation visible
- L'illustration occupe ~40% de l'écran — pose l'ambiance sans surcharger
- Le CTA utilise un verbe immersif ("Entrer") plutôt que fonctionnel ("Continuer")
- Pas de StepIndicator (c'est un splash, pas une étape)

### E6 — Setup profil

#### WF-E6-01 — Choix du pseudo

```
┌─────────────────────────────────────┐
│                                     │
│  ● ○                               │ ← StepIndicator (2 étapes)
│                                     │
│                                     │
│     Comment vous                    │
│     appelle-t-on,                   │ ← Question narrative
│     aventurier ?                    │   ton immersif
│                                     │
│                                     │
│     ┌───────────────────────┐       │
│     │ Votre pseudo           │       │ ← Input texte
│     └───────────────────────┘       │   focus auto à l'arrivée
│                                     │
│     C'est votre identité sur        │ ← Aide contextuelle discrète
│     JDRAI. Vous pourrez choisir     │   clarifie : pseudo = compte,
│     un autre nom pour chaque        │   pas nom en aventure
│     aventure.                       │
│                                     │
│                                     │
│     ┌───────────────────────┐       │
│     │      CONTINUER        │       │ ← Désactivé si champ vide
│     └───────────────────────┘       │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

#### WF-E6-02 — Lancement tutoriel (ou skip)

```
┌─────────────────────────────────────┐
│                                     │
│  ○ ●                               │ ← StepIndicator (étape 2/2)
│                                     │
│                                     │
│     Aldric, êtes-vous               │
│     prêt pour votre                 │ ← Personnalisé avec le pseudo
│     première aventure ?             │
│                                     │
│     ┌─────────────────────────┐     │
│     │  ✒️                      │     │
│     │  Un court tutoriel      │     │ ← NarrativeBox
│     │  vous apprendra les     │     │   description engageante
│     │  bases en jouant.       │     │   pas "formation obligatoire"
│     │                         │     │
│     │  Durée : ~5 min         │     │ ← Estimation rassurante
│     └─────────────────────────┘     │
│                                     │
│     ┌───────────────────────┐       │
│     │    C'EST PARTI !       │       │ ← CTA primaire → E7
│     └───────────────────────┘       │
│                                     │
│     Passer et aller au Hub          │ ← SkipButton (lien discret)
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Le pseudo saisi en E6-01 est réutilisé dans le titre ("Aldric, êtes-vous prêt...")
- La NarrativeBox décrit le tutoriel de façon engageante
- L'estimation de durée (~5 min) rassure et réduit le drop-off
- Le SkipButton est un **lien texte**, pas un bouton — visible mais non-intrusif
- Si skip → Hub avec profil basique (pas de méta-personnage construit, cf. WF-E8-02/E8-03)

### E7 — Tutoriel

> **Principe :** E7 utilise la structure complète de E10 (cf. [`E10-session-de-jeu.md`](E10-session-de-jeu.md)). Seules les **différences** sont documentées ci-dessous. Tous les états E10 (streaming, loading, erreurs) s'appliquent identiquement.

#### WF-E7-01 — Première scène + tooltip de guidage

```
┌─────────────────────────────────────┐
│  ⚔️ Le Premier Pas           [⚙]  │ ← SessionHeader
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │   titre de l'aventure tutoriel
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  Vous ouvrez les yeux.      │    │
│  │  Un feu crépite devant      │    │ ← NarrationPanel (identique E10)
│  │  vous. Vous êtes assis      │    │   MJ plus guidant que d'habitude
│  │  sur un banc de pierre,     │    │
│  │  dans ce qui semble être    │    │
│  │  une caverne.               │    │
│  │                             │    │
│  │  Une voix résonne :         │    │
│  │  "Enfin réveillé ?"         │    │
│  │                             │    │
│  │  ┌───────────────────────┐  │    │
│  │  │ 1. Regarder autour    │◄─┼─┐  │
│  │  └───────────────────────┘  │ │  │
│  │  ┌───────────────────────┐  │ │  │
│  │  │ 2. Répondre à la voix │  │ │  │
│  │  └───────────────────────┘  │ │  │
│  │                             │ │  │
│  └─────────────────────────────┘ │  │
│                                   │  │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │  │
│  │ 💡 Choisissez une option   │──┘  │ ← TutorialTooltip
│  │ ou écrivez librement       │     │   pointe vers les choix
│  │ ci-dessous !               │     │   fond semi-transparent
│  │              [Compris !]   │     │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘     │
│ ┌─────────────────────────────────┐ │
│ │ 📜│ Écrire votre action...  [➤]│ │ ← FreeInput (identique E10)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Notes :**

- Structure identique à E10 WF-E10-01 + un TutorialTooltip en overlay
- Le tooltip apparaît **uniquement** à la première scène et se ferme via "Compris !"
- Maximum **3 tooltips** dans tout le tutoriel pour ne pas frustrer :
  1. Premier choix (ci-dessus)
  2. Premier usage de la saisie libre
  3. Présentation du menu pause (`[⚙]`)
- Après fermeture, le tooltip ne réapparaît plus

#### WF-E7-02 — Choix contextuel de race (PresetSelector)

```
┌─────────────────────────────────────┐
│  ⚔️ Le Premier Pas           [⚙]  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  L'ancien vous observe      │    │
│  │  avec attention.            │    │
│  │                             │    │
│  │  "Dis-moi, étranger...     │    │ ← Narration contextuelle
│  │  d'où viens-tu ?"          │    │   amène naturellement le choix
│  │                             │    │
│  │  ┌─────────────────────┐    │    │
│  │  │  🧝  Elfe            │    │    │ ← PresetSelector
│  │  │      Agile & percep- │    │    │   remplace ChoiceButtons
│  │  │      tif              │    │    │   pour les moments de
│  │  └─────────────────────┘    │    │   création personnage
│  │  ┌─────────────────────┐    │    │
│  │  │  🧔  Nain            │    │    │   Cartes plus riches :
│  │  │      Résistant &     │    │    │   icône + nom + trait
│  │  │      tenace           │    │    │
│  │  └─────────────────────┘    │    │
│  │  ┌─────────────────────┐    │    │
│  │  │  👤  Humain          │    │    │
│  │  │      Polyvalent      │    │    │
│  │  └─────────────────────┘    │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📜│ Écrire votre action...  [➤]│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Notes :**

- Le PresetSelector apparaît **dans le flux narratif** (inside NarrationPanel), exactement comme les ChoiceButtons
- Visuellement plus riche qu'un ChoiceButton : icône + nom + trait descriptif
- Le joueur ne sait pas qu'il "crée un personnage" — il répond à une question du MJ
- La saisie libre reste active (le joueur peut répondre autrement → le MJ s'adapte)

#### WF-E7-03 — Choix contextuel de classe (PresetSelector)

> **Même structure que WF-E7-02.** Le MJ amène le choix différemment dans la narration.

```
┌─────────────────────────────────────┐
│  ⚔️ Le Premier Pas           [⚙]  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  L'ancien hoche la tête.    │    │
│  │  "Et quelles sont tes      │    │
│  │  compétences, voyageur ?"  │    │
│  │                             │    │
│  │  ┌─────────────────────┐    │    │
│  │  │  ⚔️  Guerrier        │    │    │ ← PresetSelector (classes)
│  │  │      Force &         │    │    │
│  │  │      résilience       │    │    │
│  │  └─────────────────────┘    │    │
│  │  ┌─────────────────────┐    │    │
│  │  │  🔮  Mage            │    │    │
│  │  │      Pouvoir &       │    │    │
│  │  │      savoir           │    │    │
│  │  └─────────────────────┘    │    │
│  │  ┌─────────────────────┐    │    │
│  │  │  🗡️  Voleur          │    │    │
│  │  │      Agilité &       │    │    │
│  │  │      ruse             │    │    │
│  │  └─────────────────────┘    │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📜│ Écrire votre action...  [➤]│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Note :** Après ce choix, le MJ confirme avec un beat narratif : _"Très bien. Je sens en vous la puissance des arcanes..."_ puis l'aventure tutoriel continue normalement. Les choix de race et de classe définissent l'apparence et l'identité du personnage (profil), pas des statistiques de gameplay.

> **⚠️ Question ouverte (architecte/PO) :** Le MJ IA utilise-t-il des stats internes (invisibles au joueur) pour résoudre les actions en fonction de la race/classe choisie ? Si oui, ces stats sont auto-assignées à ce moment. Décision hors périmètre UX — à trancher côté game design / architecture.

#### WF-E7-04 — Fin du tutoriel (TutorialEndCard)

> **Contexte :** L'aventure tutoriel est terminée (courte : 2-3 milestones). Cet écran remplace E11 pour le tutoriel uniquement.

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│             🎉                      │ ← Animation de célébration
│                                     │
│     Aventure terminée !             │
│                                     │
│     Vous avez survécu à votre       │ ← Félicitations personnalisées
│     premier défi, Aldric.           │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                              │    │
│  │  ┌────┐  Aldric              │    │ ← TutorialEndCard
│  │  │ 🧝 │  Elfe — Mage         │    │   révèle le méta-personnage
│  │  │    │                      │    │   créé pendant le tutoriel
│  │  └────┘  Votre personnage     │    │
│  │          a pris forme au     │    │
│  │          fil de cette        │    │
│  │          aventure !          │    │
│  │                              │    │
│  └─────────────────────────────┘    │
│                                     │
│     ┌───────────────────────┐       │
│     │  DÉCOUVRIR LE HUB     │       │ ← CTA primaire → Hub
│     └───────────────────────┘       │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Notes :**

- Plein écran (plus de SessionHeader ni FreeInput — l'aventure est finie)
- Le personnage créé pendant le tutoriel (race + classe) est révélé comme **méta-personnage**
- Le terme "méta-personnage" n'est pas utilisé explicitement — on dit "votre personnage" (cf. UX Cartography §7.3 : ne jamais présenter les deux concepts en même temps)
- Le CTA mène au Hub (E8) où le joueur verra son MetaCharacterBanner pour la première fois
- **P3** : le compagnon pourrait intervenir ici ("Pas mal pour un débutant !")

---

## 4. États d'erreur et edge cases

### WF-OB-01 — Pseudo déjà pris (E6)

```
┌─────────────────────────────────────┐
│                                     │
│  ● ○                               │
│                                     │
│     Comment vous                    │
│     appelle-t-on,                   │
│     aventurier ?                    │
│                                     │
│     ┌───────────────────────┐       │
│     │ Aldric                 │       │ ← Input avec erreur
│     └───────────────────────┘       │
│     ⚠️ Ce pseudo est déjà pris.     │ ← Erreur inline
│     Essayez "Aldric_42" ?           │   suggestion automatique
│                                     │
│     ┌───────────────────────┐       │
│     │      CONTINUER        │       │ ← Désactivé tant que
│     └───────────────────────┘       │   l'erreur persiste
│                                     │
└─────────────────────────────────────┘
```

### WF-OB-02 — Erreurs E7 (héritées de E10)

Les erreurs en E7 (perte de connexion, LLM timeout, rate limiting) suivent **exactement** les wireframes E10 :

- Perte connexion → WF-E10-08
- Rate limiting → WF-E10-09
- Erreur LLM → WF-E10-10

Aucune adaptation spécifique au tutoriel.

### WF-OB-03 — Tutoriel interrompu (quit via menu pause)

Le joueur quitte le tutoriel via le menu pause E10 (WF-E10-05 → WF-E10-06). Après confirmation :

- Redirection vers le **Hub** (E8)
- Le Hub affiche l'état **WF-E8-02** (empty state) — aucune aventure terminée, pas de méta-personnage construit
- L'aventure tutoriel n'est **pas** sauvegardée (trop courte pour justifier une reprise)
- Le joueur peut lancer une aventure normale depuis le Hub

---

## 5. Wireframes desktop (> 1024px)

### E5/E6 — Desktop

Les écrans E5 et E6 sont des **contenus centrés plein écran** (pas de sidebar, pas de navigation). Sur desktop :

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                                                                          │
│                                                                          │
│              ┌──────────────────────────────────────┐                    │
│              │                                      │                    │
│              │   [Contenu E5 ou E6                   │                    │
│              │    centré, max-width: ~480px]          │                    │
│              │                                      │                    │
│              │   Identique au mobile                 │                    │
│              │   dans un conteneur centré             │                    │
│              │                                      │                    │
│              └──────────────────────────────────────┘                    │
│                                                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Notes :**

- Pas de sidebar (navigation masquée pendant l'onboarding)
- Contenu centré avec `max-width: ~480px` — feeling formulaire simple
- Fond atmosphérique (dark fantasy) visible autour du contenu
- L'illustration E5 peut être plus large sur desktop (~600px)

### E7 — Desktop

Le tutoriel desktop suit exactement le wireframe E10 desktop (WF-E10-11) avec les mêmes spécificités tutoriel (TutorialTooltip, PresetSelector). Pas de wireframe additionnel nécessaire.

---

## 6. Interactions et transitions

### Flow global

```
E5 (Welcome) ──[Entrer]──► E6-01 (Pseudo) ──[Continuer]──► E6-02 (Ready?)
                                                                │
                                                     ┌──────────┴──────────┐
                                                     │                     │
                                              [C'est parti !]      [Passer/Skip]
                                                     │                     │
                                                     ▼                     ▼
                                               E7 (Tutoriel)         Hub (E8)
                                                     │            profil basique
                                                     ▼
                                              E7-04 (Fin tuto)
                                                     │
                                              [Découvrir le Hub]
                                                     │
                                                     ▼
                                               Hub (E8)
                                           méta-personnage créé
```

### Détail des interactions

| Action utilisateur                      | Résultat                                                           |
| --------------------------------------- | ------------------------------------------------------------------ |
| Tap "Entrer" (E5)                       | Navigation vers E6-01                                              |
| Saisie pseudo + tap "Continuer" (E6-01) | Validation pseudo → navigation vers E6-02                          |
| Tap "C'est parti !" (E6-02)             | Navigation vers E7 (tutoriel)                                      |
| Tap "Passer et aller au Hub" (E6-02)    | Skip → navigation vers Hub (E8) avec profil basique                |
| Tap "Compris !" sur un tooltip (E7)     | Ferme le tooltip, ne réapparaît plus                               |
| Tap PresetSelector card (E7)            | Sélection race/classe → écho du choix → MJ continue                |
| Saisie libre sur un PresetSelector (E7) | Le MJ interprète et adapte (le joueur peut contourner les presets) |
| Tap `[⚙]` en E7                         | Menu pause E10 (quitter = abandonner le tutoriel)                  |
| Tap "Découvrir le Hub" (E7-04)          | Navigation vers Hub (E8) avec méta-personnage créé                 |

---

## 7. Règles de comportement

| Règle                          | Description                                                                                                                                                                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tunnel linéaire**            | Pas de bouton retour, pas de navigation libre. Chaque écran mène au suivant. L'utilisateur ne peut pas revenir à E5 depuis E6.                                                                                                                                                                                         |
| **Pseudo**                     | Obligatoire, unique, 3-20 caractères. Validation côté serveur de l'unicité. Suggestion automatique si pris. **Si le joueur quitte l'app sur l'écran pseudo (E6-01) sans le valider, il sera redirigé vers E6-01 à sa prochaine connexion** (le pseudo est requis pour continuer).                                      |
| **Skip**                       | Disponible uniquement sur E6-02 (après avoir défini le pseudo). Le joueur arrive au Hub sans méta-personnage construit (race = Humain, classe = Aventurier par défaut — valeurs invisibles en P1, cf. architecture data-models §Valeurs par défaut). Il peut jouer normalement mais n'a pas les bénéfices du tutoriel. |
| **Tutoriel = vraie session**   | E7 utilise le moteur de jeu complet (LLM, auto-save, streaming). Ce n'est pas une simulation — les choix sont réels.                                                                                                                                                                                                   |
| **Création contextuelle**      | Race et classe sont choisies via PresetSelector dans le flux narratif. Le joueur ne sait pas qu'il "configure" un personnage. Ces choix définissent l'identité et l'apparence du profil                                                                                                                                |
| **Tooltips**                   | Maximum 3 dans tout le tutoriel. Apparaissent une seule fois. Se ferment via "Compris !". Non-bloquants (le joueur peut interagir derrière).                                                                                                                                                                           |
| **Durée tutoriel**             | L'aventure tutoriel dure ~5 min (2-3 milestones). Structurée pour couvrir : narration, choix, saisie libre, création perso.                                                                                                                                                                                            |
| **Pas de sauvegarde tutoriel** | Si le joueur quitte en cours de tutoriel, l'aventure n'est pas sauvegardée. Trop courte pour justifier une reprise partielle.                                                                                                                                                                                          |
| **Méta-personnage**            | Créé à la fin de E7 à partir des choix faits pendant le tutoriel (race + classe). Le terme "méta-personnage" n'est pas affiché — on dit "votre personnage".                                                                                                                                                            |
| **Compagnon (P3)**             | Emplacements réservés sur E5 (welcome), E6-02 (encouragement), E7-04 (félicitations). En P1, textes statiques.                                                                                                                                                                                                         |

---

**Document généré via BMAD Method — Phase UX Phase 2 (Sally, UX Expert)**
