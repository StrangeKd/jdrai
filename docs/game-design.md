# JDRAI — Game Design Document (GDD)

**Version :** 0.1 (draft)
**Date :** 2026-02-15
**Statut :** Draft — en attente review CEO
**Auteurs :** Samus Shepard (Game Designer) + Paige (Tech Writer), BMAD Method
**Références :** PRD v1.4, UX Cartography v1.1, Architecture v1.4, Wireframes v0.3

---

## Table des matières

1. [Objectif du document](#1-objectif-du-document)
2. [Core Loop](#2-core-loop)
3. [Système de résolution](#3-système-de-résolution)
4. [Personnalité du MJ IA](#4-personnalité-du-mj-ia)
5. [Pacing narratif : Milestones & Events](#5-pacing-narratif--milestones--events)
6. [Fail states & Game Over](#6-fail-states--game-over)
7. [Interaction joueur](#7-interaction-joueur)
8. [Progression & Récompenses](#8-progression--récompenses)
9. [Difficulté](#9-difficulté)
10. [Célébrations UX (Game Feel)](#10-célébrations-ux-game-feel)
11. [Décisions de Game Design (ADR)](#11-décisions-de-game-design-adr)
12. [Questions ouvertes](#12-questions-ouvertes)
13. [Glossaire](#13-glossaire)

---

## 1. Objectif du document

Ce GDD centralise les **décisions de game design** de JDRAI. Il complète le PRD (quoi construire) et l'architecture (comment construire) en répondant au **pourquoi de l'expérience joueur**.

**Ce document est la source de vérité pour :**

- Le comportement du MJ IA (prompts system, ton, règles)
- La résolution des actions en jeu
- Les mécaniques de progression et de récompense
- Les fail states et leur gestion
- Le rythme narratif (pacing)

**Ce document ne couvre PAS :**

- Les spécifications techniques (→ `docs/architecture/`)
- Les wireframes et l'UI (→ `docs/ux/`)
- Le scope produit et la roadmap (→ `docs/prd.md`)

---

## 2. Core Loop

Le core loop est la boucle d'engagement fondamentale du joueur. Chaque feature P1 doit renforcer cette boucle.

### 2.1 Core Loop principal

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CORE LOOP JDRAI                              │
│                                                                      │
│    ┌─────────┐    ┌───────────┐    ┌───────────┐    ┌────────────┐   │
│    │   HUB   │───►│  CONFIG   │───►│   JOUER   │───►│    FIN     │   │
│    │         │    │ AVENTURE  │    │ (Session) │    │ (Résumé +  │   │
│    │         │    │           │    │           │    │ Récompenses│   │
│    └────▲────┘    └───────────┘    └───────────┘    └─────┬──────┘   │
│         │                                                 │          │
│         └─────────────────────────────────────────────────┘          │
│                        Retour + Progression                          │
└──────────────────────────────────────────────────────────────────────┘
```

| Étape | Émotion cible | Durée cible | Mécaniques clés |
| --- | --- | --- | --- |
| **Hub** | Anticipation, choix | < 1 min | Voir progression, choisir aventure |
| **Config** | Excitation, personnalisation | < 2 min | Thème, durée, difficulté OU template OU aléatoire |
| **Jouer** | Immersion, tension, découverte | 10-60 min | Narration MJ, choix, milestones |
| **Fin** | Accomplissement, satisfaction | < 1 min | Résumé, récompenses, retour Hub |

### 2.2 Boucle de session (micro-loop)

À l'intérieur de la session de jeu, le joueur vit une boucle rapide :

```
MJ narre la situation
       │
       ▼
Joueur choisit (suggestion OU texte libre)
       │
       ▼
MJ résout l'action (succès/échec/nuance)
       │
       ▼
MJ narre la conséquence + nouvelle situation
       │
       └──► (boucle)
```

**Règle de pacing :** Chaque échange (1 action joueur + 1 réponse MJ) doit faire progresser la narration. Le MJ ne doit jamais "tourner en rond" ni répéter la même situation.

### 2.3 Critère d'évaluation des features

Toute feature P1 doit répondre positivement à au moins une de ces questions :

- Est-ce que ça rend le **Hub** plus motivant ? (anticipation)
- Est-ce que ça rend la **Config** plus rapide/excitante ? (friction minimale)
- Est-ce que ça rend la **Session** plus immersive ? (flow)
- Est-ce que ça rend la **Fin** plus gratifiante ? (récompense)
- Est-ce que ça encourage le **Retour** au Hub ? (rétention)

---

## 3. Système de résolution

### 3.1 Approche P1 : Résolution narrative

En P1, le MJ IA résout les actions du joueur de manière **purement narrative** — sans dés visibles ni mécaniques numériques exposées.

**Fonctionnement :**

1. Le joueur décrit ou sélectionne une action
2. Le MJ évalue la **plausibilité narrative** en fonction de :
   - Le contexte de la scène
   - Les capacités implicites du personnage (classe, race)
   - La difficulté configurée de l'aventure
   - La cohérence avec les actions précédentes
3. Le MJ décrit le résultat avec **nuance** (pas binaire succès/échec) :
   - **Succès net** : l'action réussit comme prévu
   - **Succès partiel** : l'action réussit mais avec une complication
   - **Échec narratif** : l'action échoue mais ouvre une nouvelle voie
   - **Échec critique** : l'action échoue avec des conséquences (selon difficulté)

**Exemple :**

> Joueur : "Je tente de crocheter la serrure de la porte."
>
> - **Succès net** : "Vos doigts habiles manipulent le mécanisme avec précision. Un clic satisfaisant, et la porte s'ouvre silencieusement."
> - **Succès partiel** : "La serrure cède, mais dans un grincement aigu. Des bruits de pas résonnent au loin — vous n'êtes plus seul."
> - **Échec narratif** : "La serrure résiste à vos efforts. Cependant, en examinant le mur adjacent, vous remarquez une fissure qui pourrait servir de passage..."
> - **Échec critique** : "Votre outil se brise dans la serrure. Non seulement la porte reste fermée, mais le bruit alerte les gardes de l'autre côté."

### 3.2 Mécaniques internes (invisibles au joueur)

Le MJ IA utilise en interne un **score de probabilité contextuel** pour guider ses résolutions, mais ce score n'est jamais exposé au joueur.

**Facteurs internes :**

| Facteur | Influence |
| --- | --- |
| Difficulté de l'aventure | Modifie le seuil de réussite global |
| Classe du personnage | Avantage sur les actions liées à la classe |
| Race du personnage | Avantage mineur contextuel (P2 — ignoré en P1 car Humain = neutre) |
| Cohérence narrative | Actions logiques dans le contexte = bonus implicite |
| Répétition | Tenter la même action échouée = malus implicite |

### 3.3 Évolution prévue (P2+)

| Phase | Ajout | Justification |
| --- | --- | --- |
| **P2** | Option "dés visibles" activable par le joueur | Joueurs expérimentés qui veulent de la transparence mécanique |
| **P2** | Stats du personnage impactent la résolution | Lié à la création de personnage avancée (F7) |
| **P3** | Résolution multijoueur (actions concurrentes) | Gestion des tours et des conflits entre joueurs |

---

## 4. Personnalité du MJ IA

### 4.1 Persona par défaut (P1)

Le MJ IA de JDRAI a une personnalité définie qui sert d'identité au produit.

**Nom interne :** "Le Chroniqueur"

**Archétype :** Un conteur expérimenté, chaleureux et légèrement théâtral. Il prend plaisir à raconter des histoires et à voir les joueurs réagir. Il n'est ni froid ni robotique — c'est un narrateur vivant.

**Traits de personnalité :**

| Trait | Description | Exemple |
| --- | --- | --- |
| **Chaleureux** | Accueillant, jamais condescendant | "Bienvenue, aventurier. L'histoire n'attendait que vous." |
| **Épique** | Descriptions immersives, vocabulaire riche | "L'aube peint le ciel de cuivre et de sang au-dessus des remparts." |
| **Réactif** | S'adapte aux choix du joueur avec enthousiasme | "Ha ! Vous n'êtes pas du genre à emprunter le chemin balisé..." |
| **Jamais punitif gratuitement** | Les échecs sont narratifs, jamais humiliants | "La chance n'est pas de votre côté, mais votre détermination inspire respect." |
| **Légèrement théâtral** | Dramatise les moments clés sans surjouer | "Le silence qui suit est assourdissant. Et dans ce silence... un murmure." |

### 4.2 Règles de ton

**Le MJ par défaut :**

- Tutoie le joueur (2e personne du singulier)
- Utilise le présent de narration
- Varie la longueur de ses réponses : courtes pour l'action, longues pour l'ambiance
- Ne brise jamais le 4e mur (contrairement au Compagnon qui, lui, le fait)
- Ne mentionne jamais de mécanique de jeu explicitement ("votre jet de dés", "votre score de...")
- Propose toujours une voie narrative, même dans les impasses

### 4.3 Adaptation par difficulté (P1)

Le ton du MJ s'ajuste légèrement selon la difficulté configurée :

| Difficulté | Ajustement de ton |
| --- | --- |
| **Easy** | Plus encourageant, descriptions plus lumineuses, indices plus fréquents |
| **Normal** | Ton standard (Le Chroniqueur par défaut) |
| **Hard** | Plus austère, descriptions plus sombres, moins d'indices |
| **Nightmare** | Menaçant, descriptions oppressantes, aucun indice gratuit |

### 4.4 Personnalisation (P2)

En P2, le joueur pourra ajuster le ton du MJ via 4 axes (cf. PRD F6) :

- **Ton** : sérieux ↔ humoristique
- **Style narratif** : concis ↔ descriptif
- **Difficulté** : easy ↔ nightmare (verrouillé en session)
- **Rigueur des règles** : narratif libre ↔ strict (verrouillé en session)

---

## 5. Pacing narratif : Milestones & Events

> **Référence :** PRD §3.4, UX Cartography §2.6, Architecture data-models.md

### 5.1 Rôle des Milestones dans le gameplay

Les milestones ne sont pas juste une structure technique — ils sont le **moteur de pacing** de l'aventure. Ils assurent que :

- L'aventure a un début, un milieu et une fin clairement définis
- La durée est prévisible et respecte le choix du joueur
- Le MJ IA ne dérive pas dans des boucles narratives infinies
- Le joueur ressent une progression narrative (sans chiffres)

### 5.2 Corrélation durée-milestones

| Durée estimée | Nombre de milestones | Profil type |
| --- | --- | --- |
| **Courte** | 2-3 | Joueur casual, session rapide, découverte |
| **Moyenne** | 4-5 | Session standard, bon équilibre narration/action |
| **Longue** | 6+ | Joueur investi, aventure riche, multiples arcs |

### 5.3 Règles de gestion des milestones par le MJ IA

| Règle | Description |
| --- | --- |
| **Séquençage** | Les milestones sont traversés dans l'ordre prévu, sauf si les actions du joueur justifient narrativement un saut ou un ajout |
| **Pas de skip silencieux** | Le MJ ne peut pas sauter un milestone sans le signaler narrativement ("L'urgence vous pousse à abandonner cette piste...") |
| **Dernier milestone = résolution** | Le dernier milestone inclut toujours la résolution de l'aventure (climax + épilogue) |
| **Pacing adaptatif** | Si le joueur s'attarde entre deux milestones, le MJ guide doucement vers le suivant. Si le joueur va vite, le MJ enrichit le milestone en cours |
| **Nom visible, position cachée** | Le joueur voit le nom du milestone en cours dans l'historique. Il ne voit jamais "Milestone 2/4" ni de barre de progression |

### 5.4 Events (P2 — anticipation design)

Les Events sont la granularité fine entre les milestones. En P2, ils permettront :

- Des rencontres optionnelles que le joueur peut découvrir ou ignorer
- Un historique plus riche (messages groupés par event dans chaque milestone)
- Des récompenses bonus liées aux events découverts (exploration)

---

## 6. Fail states & Game Over

### 6.1 Philosophie

JDRAI adopte une approche **"fail forward"** : l'échec fait avancer l'histoire, il ne l'arrête pas. Un game over brutal est rarement fun, surtout pour le persona "Le Curieux" (débutant).

### 6.2 Matrice de fail states par difficulté

| Situation | Easy | Normal | Hard | Nightmare |
| --- | --- | --- | --- | --- |
| **HP à 0 (combat)** | Sauvetage narratif automatique (PNJ, événement, miracle) | Sauvetage narratif avec conséquence (perte d'objet, blessure narrative) | Dernière chance : choix critique. Échec = fin d'aventure | Mort = fin d'aventure immédiate |
| **Choix catastrophique** | Le MJ adoucit les conséquences et offre une seconde chance | Conséquences réelles mais surmontables | Conséquences lourdes, pas de seconde chance | Conséquences irréversibles |
| **Impasse narrative** | Le MJ propose un nouvel angle d'approche | Le MJ donne un indice subtil | Pas d'aide — le joueur doit trouver seul | Pas d'aide, le temps joue contre le joueur |
| **Abandon volontaire** | Sauvegarde + "Vous pourrez revenir" | Sauvegarde + "Vous pourrez revenir" | Sauvegarde + "Vous pourrez revenir" | Sauvegarde + "Vous pourrez revenir" |

### 6.3 Fin d'aventure forcée (game over)

Quand une aventure se termine par un échec (Hard/Nightmare) :

1. Le MJ narre la conclusion de manière **épique, pas humiliante** ("Votre quête s'achève ici, mais votre légende ne fait que commencer...")
2. L'écran de fin (E11) s'affiche avec :
   - Le résumé narratif de l'aventure (incluant l'échec final)
   - Les milestones atteints avant l'échec
   - Placeholder récompenses (P2 : XP réduite mais non nulle — récompenser l'effort)
3. L'aventure passe en statut `completed` (pas `abandoned` — c'est une vraie fin)
4. Le joueur retourne au Hub

### 6.4 Distinction game over vs abandon

| | Game over | Abandon |
| --- | --- | --- |
| **Déclencheur** | Échec en jeu (mort, catastrophe narrative) | Choix du joueur (menu → abandonner) |
| **Statut aventure** | `completed` | `abandoned` |
| **Écran de fin** | Oui (résumé avec conclusion d'échec) | Non (confirmation puis retour Hub) |
| **Récompenses (P2)** | XP réduite, milestones partiels comptabilisés | Aucune récompense |
| **Compteur 5 aventures** | Libère un slot | Libère un slot |

---

## 7. Interaction joueur

### 7.1 Format hybride

Chaque tour d'interaction suit ce format :

```
┌────────────────────────────────────────────────────────────┐
│  MJ : [Narration de la situation - 2 à 5 paragraphes]      │
│                                                             │
│  [Description de l'environnement, des PNJ, de l'ambiance]  │
│                                                             │
│  Que faites-vous ?                                          │
│                                                             │
│  [1] Action suggérée A                                      │
│  [2] Action suggérée B                                      │
│  [3] Action suggérée C                                      │
│                                                             │
│  > OU saisissez votre action : ___________                  │
└────────────────────────────────────────────────────────────┘
```

### 7.2 Règles des choix suggérés

| Règle | Description |
| --- | --- |
| **Nombre** | 2 à 4 choix par tour (jamais 1, jamais 5+) |
| **Diversité** | Les choix couvrent des approches différentes (combat, diplomatie, exploration, fuite...) |
| **Pas de "bon" choix évident** | Chaque choix est viable — pas de piège déguisé ni d'option clairement supérieure |
| **Pas de répétition** | Un choix déjà proposé et ignoré ne revient pas identique au tour suivant |
| **Longueur** | 5 à 15 mots par choix — assez pour comprendre, pas assez pour remplacer l'imagination |

### 7.3 Gestion du texte libre

Le texte libre est la force de JDRAI — il différencie le produit d'un simple "choose your adventure".

**Le MJ doit :**

- Accepter toute action raisonnable dans le contexte
- Interpréter les actions vagues avec bienveillance ("je regarde autour" → description de l'environnement)
- Rediriger les actions impossibles/absurdes avec diplomatie ("Vous essayez de voler, mais la gravité a d'autres plans...")
- Ne jamais répondre "vous ne pouvez pas faire ça" sans proposer une alternative

**Le MJ ne doit PAS :**

- Exécuter des actions qui brisent l'univers narratif (technologie moderne dans un setting médiéval)
- Permettre des actions qui trivialisent l'aventure ("je tue le boss final avec mes yeux laser")
- Ignorer le texte libre au profit des choix suggérés (le texte libre est un choix comme un autre)

### 7.4 Longueur des réponses MJ

| Contexte | Longueur cible |
| --- | --- |
| Action de combat ou rapide | 1-2 paragraphes |
| Exploration d'un nouveau lieu | 2-3 paragraphes |
| Moment narratif clé (milestone) | 3-5 paragraphes |
| Dialogue avec PNJ | 1-3 paragraphes + dialogue formaté |
| Introduction d'aventure | 3-5 paragraphes (mise en ambiance) |

---

## 8. Progression & Récompenses

### 8.1 Philosophie P1

En P1, la progression est **narrative uniquement**. Le joueur progresse dans l'histoire, pas dans des chiffres. La satisfaction vient de :

- L'atteinte de milestones (moments narratifs marquants)
- La conclusion de l'aventure (résumé + sentiment d'accomplissement)
- Le retour au Hub avec une nouvelle aventure dans l'historique

### 8.2 Placeholder récompenses (P1 → P2)

L'écran de fin (E11) affiche en P1 :

- Le résumé narratif
- La liste des milestones atteints
- Un **placeholder visuel** pour les récompenses futures (XP, achievements) — cf. wireframe E11

En P2, les récompenses deviendront fonctionnelles :

| Récompense | Description | Source |
| --- | --- | --- |
| **XP** | Points d'expérience ajoutés au méta-personnage | Complétion de milestones + fin d'aventure |
| **Achievements** | Succès débloquables (conditions spécifiques) | Actions spéciales, exploration, milestones bonus |
| **Cosmétiques** | Titres, badges, éléments visuels | Liés aux achievements |

### 8.3 Barème XP envisagé (P2 — à affiner)

| Source | XP |
| --- | --- |
| Milestone complété | Variable (défini par le MJ IA selon l'importance) |
| Aventure terminée (succès) | Bonus de complétion |
| Aventure terminée (game over) | XP réduite (récompenser l'effort) |
| Aventure abandonnée | Aucune XP |
| Event optionnel découvert | Bonus exploration (P2) |

---

## 9. Difficulté

### 9.1 Les 4 niveaux

| Niveau | Nom affiché | Philosophie | Public cible |
| --- | --- | --- | --- |
| **Easy** | Facile | L'histoire avant le défi. Le MJ est bienveillant, les échecs sont doux. | Le Curieux (débutant) |
| **Normal** | Normal | Équilibre narration/défi. Le MJ est juste, les échecs ont des conséquences. | Le Solo (standard) |
| **Hard** | Difficile | Le défi est réel. Le MJ est exigeant, les erreurs coûtent cher. | Le Solo (expérimenté) |
| **Nightmare** | Cauchemar | Survie narrative. Le MJ est impitoyable, la mort rôde. | Le Groupe Orphelin, rôlistes |

### 9.2 Impact concret de la difficulté

| Aspect | Easy | Normal | Hard | Nightmare |
| --- | --- | --- | --- | --- |
| **Résolution** | Réussites fréquentes, échecs rares | Équilibré | Échecs fréquents, réussites méritées | Échecs majoritaires |
| **Indices** | Fréquents et explicites | Occasionnels et subtils | Rares | Aucun |
| **Fail state** | Toujours sauvé narrativement | Sauvé avec conséquences | Dernière chance puis game over | Game over direct |
| **Ton MJ** | Encourageant, lumineux | Standard (Le Chroniqueur) | Austère, sombre | Menaçant, oppressant |
| **Longueur réponses** | Plus courtes (accessibilité) | Standard | Standard à longues | Longues (tension) |

### 9.3 Difficulté verrouillée en session

La difficulté est définie au lancement de l'aventure (E9) et **ne peut pas être modifiée en cours de session** (cf. PRD F6, UX Cartography §4.2). Justification : changer la difficulté en cours d'aventure casserait la cohérence narrative et l'équilibrage du MJ IA.

---

## 10. Célébrations UX (Game Feel)

### 10.1 Principes

Les "micro-moments" de célébration renforcent le core loop en associant des émotions positives aux étapes clés. Ils sont subtils mais importants — c'est le "juice" qui rend l'expérience mémorable.

**Règle :** Les célébrations sont **narratives et visuelles**, jamais numériques. Pas de "+50 XP" qui s'affiche (ça viendra en P2 si pertinent).

### 10.2 Moments de célébration P1

| Moment | Célébration | Priorité |
| --- | --- | --- |
| **Atteinte d'un milestone** | Transition visuelle : titre du milestone affiché brièvement en overlay (style RPG classique, texte doré sur fond assombri), puis fondu retour à la narration | P1 |
| **Fin d'aventure (succès)** | Écran de fin avec résumé narratif, animation de transition depuis la session vers E11, liste des milestones comme "chapitres de votre légende" | P1 |
| **Fin d'aventure (game over)** | Même écran de fin mais avec ton solennel — "Votre quête s'achève ici" — les milestones atteints sont présentés comme l'héritage du personnage | P1 |
| **Lancement d'aventure** | Transition Hub → Session avec texte d'introduction (fade-in progressif, style "Il était une fois...") | P1 |
| **Premier choix en session** | Le MJ réagit au premier choix du joueur avec un commentaire qui valide l'agentivité du joueur | P1 |

### 10.3 Moments de célébration P2+

| Moment | Célébration | Phase |
| --- | --- | --- |
| **Gain d'XP** | Animation de la barre de progression sur l'écran de fin | P2 |
| **Level up** | Notification spéciale + message du Compagnon | P2/P3 |
| **Achievement débloqué** | Badge animé + message contextuel | P2 |
| **Milestone avec event rare** | Indication "Vous avez découvert un chemin secret" | P2 |

---

## 11. Décisions de Game Design (ADR)

Chaque décision significative est tracée ici avec sa justification.

### GD-001 : Résolution narrative sans dés en P1

- **Décision :** Pas de dés visibles ni de mécaniques numériques exposées en P1
- **Alternatives rejetées :** Dés visibles dès P1, système de stats visible
- **Justification :** Le persona principal P1 ("Le Curieux") n'a aucune référence JDR. Les dés ajoutent de la complexité cognitive sans valeur pour ce public. La résolution narrative est plus immersive et plus simple pour les prompts LLM. Les dés seront une option P2 pour les joueurs expérimentés.
- **Impact :** Simplifie les prompts MJ, supprime le besoin d'UI de dés en P1, les stats personnage sont internes uniquement

### GD-002 : Fail forward par défaut

- **Décision :** En Easy et Normal, le joueur ne peut pas avoir de game over. Le MJ trouve toujours une issue narrative.
- **Alternatives rejetées :** Game over possible à toutes les difficultés, système de "vies"
- **Justification :** Un game over frustrant après 30 minutes de jeu tue la rétention, surtout pour les débutants. Le fail forward maintient l'immersion et respecte l'investissement narratif du joueur. Les joueurs expérimentés qui veulent du risque choisiront Hard ou Nightmare.
- **Impact :** Le MJ IA doit toujours avoir un plan B narratif en Easy/Normal. Les prompts doivent inclure cette instruction.

### GD-003 : Personnalité MJ définie ("Le Chroniqueur")

- **Décision :** Le MJ par défaut a une personnalité nommée et caractérisée, pas un ton neutre/générique
- **Alternatives rejetées :** MJ neutre/objectif, MJ customisable dès P1
- **Justification :** Un MJ avec personnalité crée une identité produit forte et différencie JDRAI des chatbots RPG génériques. Le ton chaleureux + épique est le sweet spot : assez immersif pour les rôlistes, assez accessible pour les débutants. La personnalisation viendra en P2.
- **Impact :** Les prompts system incluent la persona "Le Chroniqueur". Tout changement de ton en P2 sera un delta par rapport à cette baseline.

### GD-004 : Pas de progression numérique visible en P1

- **Décision :** Le joueur ne voit jamais de chiffres de progression (XP, niveau, %, position dans les milestones)
- **Alternatives rejetées :** Barre de progression visible, compteur de milestones "2/4"
- **Justification :** JDRAI est une expérience narrative, pas un RPG tabulaire. Montrer des chiffres casse l'immersion et transforme l'aventure en checklist. La progression est ressentie à travers l'histoire, pas à travers des métriques. Les récompenses numériques (XP, niveaux) arrivent en P2 pour le méta-personnage, dans le Hub — jamais en session.
- **Impact :** Le frontend ne reçoit jamais de données position/total pour les milestones. Le Hub P1 n'affiche pas de niveau ni de XP.

### GD-005 : Difficulté à 4 niveaux, verrouillée en session

- **Décision :** 4 niveaux de difficulté (easy/normal/hard/nightmare), non modifiables une fois l'aventure lancée
- **Alternatives rejetées :** 5 niveaux, difficulté dynamique, slider libre, modifiable en session
- **Justification :** 4 niveaux couvrent le spectre complet des personas (Curieux → Rôliste exigeant) sans paralysie du choix. Verrouiller en session garantit la cohérence narrative : le MJ ajuste son comportement dès le départ et ne peut pas changer ses règles en cours de route.
- **Impact :** Le MJ IA reçoit la difficulté dans son prompt initial et ne la réévalue jamais. L'UI de config affiche 4 options distinctes, pas un slider.

---

## 12. Questions ouvertes

| # | Question | Options identifiées | Impact | Bloquant P1 ? |
| --- | --- | --- | --- | --- |
| QG-1 | **Thème/genre par défaut pour P1** : Uniquement heroic fantasy, ou plusieurs genres dès le MVP ? | A) Heroic fantasy uniquement — plus simple, identité forte. B) 2-3 genres (fantasy, dark fantasy, steampunk) — plus de rejouabilité | Nombre de templates, complexité des prompts MJ | Non — commencer avec fantasy, élargir en P2+ |
| QG-2 | **Dés en P1 — mécaniques cachées ou absentes ?** | A) Le MJ utilise un RNG interne pour ajouter de l'aléatoire aux résolutions. B) Résolution 100% narrative sans aléatoire, le LLM décide seul | Cohérence des résolutions, charge computationnelle | Non — à tester lors du prototypage LLM |
| QG-3 | **HP du personnage — visible ou caché en P1 ?** | A) HP visible dans le panneau personnage (donne un sens de risque). B) HP caché (le MJ narre l'état du perso : "Vous êtes blessé") | UI du panneau personnage, prompts MJ | Oui — impacte le wireframe E10 et les prompts |
| QG-4 | **Inventaire en P1** | A) Inventaire basique (objets narratifs listés). B) Pas d'inventaire P1 (le MJ gère narrativement) | UI panneau personnage, complexité MJ | Non — option B par défaut, A si facile à implémenter |
| QG-5 | **Templates d'aventure P1 — combien ?** | A) 3-5 templates couvrant les bases. B) Templates générés dynamiquement par le LLM | Contenu à rédiger, coût LLM | Non — 3-5 templates manuels suffisent pour le MVP |

---

## 13. Glossaire

| Terme | Définition |
| --- | --- |
| **Core loop** | Boucle d'engagement fondamentale : Hub → Config → Jouer → Fin → Hub |
| **Micro-loop** | Boucle rapide en session : MJ narre → Joueur agit → MJ résout → MJ narre |
| **Fail forward** | Philosophie de design où l'échec fait progresser l'histoire au lieu de l'interrompre |
| **Game feel** | L'ensemble des micro-interactions et feedbacks qui rendent l'expérience satisfaisante |
| **Pacing** | Rythme narratif d'une aventure, contrôlé par les milestones |
| **Résolution narrative** | Méthode de résolution des actions sans mécaniques numériques visibles |
| **Le Chroniqueur** | Nom interne de la personnalité par défaut du MJ IA |
| **Juice** | Feedbacks visuels/sonores/narratifs qui rendent les moments clés mémorables |
| **Permadeath** | Game over définitif (uniquement en difficulté Nightmare) |
| **Agentivité** | Sentiment du joueur d'avoir un impact réel sur l'histoire par ses choix |

---

**Document généré par Samus Shepard (Game Designer) + Paige (Tech Writer) — BMAD Method**
**En attente : Review point par point avec CEO**
