# Stories & Backlog — JDRAI P1

**Version :** 0.1
**Date :** 2026-02-08
**Statut :** En cours — Étape 1

---

## Organisation

```
docs/stories/
├── README.md                          # Ce fichier (workflow + suivi)
├── epics.md                           # Liste des epics P1 avec scope et dépendances

_bmad-output/implementation-artifacts/
└── {epicNum}-{titre-slug}.story.md    # Stories individuelles (ex: 1-1-initialisation-monorepo.story.md)
```

**Convention de nommage des stories :** `{epicNum}.{storyNum}.story.md`
- `epicNum` : numéro de l'epic (1, 2, 3...)
- `storyNum` : numéro de la story dans l'epic (1, 2, 3...)
- Exemple : `1.1.story.md` = Epic 1, Story 1

---

## Workflow de préparation du backlog

### Étape 1 — Découpage en Epics (SM + PO)

**Objectif :** Identifier et nommer les epics P1 à partir du PRD et des wireframes validés.

| | |
|---|---|
| **Input** | PRD §4.2 (fonctionnalités P1), UX Cartography §2 (flows), wireframes validés |
| **Output** | `epics.md` — Liste ordonnée des epics avec scope clair |
| **SM** | Prépare le découpage |
| **PO** | Valide le périmètre de chaque epic, arbitre les cas limites (P1 vs P2) |
| **Statut** | `[ ] À faire` |

### Étape 2 — Priorisation et dépendances des Epics (PO + SM + Architect)

**Objectif :** Définir l'ordre de développement des epics en fonction des dépendances techniques et de la valeur produit.

| | |
|---|---|
| **Input** | Liste des epics (étape 1), architecture technique (dépendances infra/auth/DB) |
| **Output** | `epics.md` enrichi — Roadmap ordonnée avec dépendances explicites |
| **PO/SM** | Priorise par valeur métier |
| **Architect** | Consulté pour les dépendances techniques (ex : Auth avant Hub) |
| **Statut** | `[ ] À faire` |

### Étape 3 — Rédaction des Stories par Epic (PO + SM)

**Objectif :** Pour chaque epic, rédiger les user stories au format standard avec critères d'acceptation.

| | |
|---|---|
| **Input** | Epic scope, wireframes correspondants, architecture (data models, API endpoints) |
| **Output** | Fichiers `{epicNum}.{storyNum}.story.md` |
| **PO** | Rédige les stories (qui, quoi, pourquoi), définit les critères d'acceptation fonctionnels |
| **SM** | Vérifie la cohérence avec la doc existante, s'assure que chaque story est indépendante et testable |
| **Statut** | `[ ] À faire` |

### Étape 4 — Review technique des Stories (Dev + Architect)

**Objectif :** Valider la faisabilité technique, identifier les zones de risque, estimer la complexité.

| | |
|---|---|
| **Input** | Stories rédigées (étape 3) |
| **Output** | Stories annotées (notes techniques, points d'attention, estimation complexité) |
| **Dev** | Review chaque story pour faisabilité, signale les manques, propose un découpage si trop grosse |
| **Architect** | Vérifie l'alignement avec l'architecture documentée |
| **Statut** | `[ ] À faire` |

### Étape 5 — Validation finale et backlog prêt (PO + SM)

**Objectif :** Backlog P1 complet, priorisé, prêt pour le premier sprint.

| | |
|---|---|
| **Input** | Stories reviewées (étape 4) |
| **Output** | Backlog ordonné, stories marquées "ready" |
| **PO** | Validation finale |
| **SM** | Vérification cohérence globale |
| **Statut** | `[ ] À faire` |

---

## Sources de vérité

> **Règle agents :** Ne jamais charger tous les fichiers d'un dossier modulaire d'un coup. Toujours commencer par le README pour identifier les fichiers pertinents, puis charger uniquement ceux nécessaires.

| Document | Point d'entrée | Rôle |
|---|---|---|
| PRD | `docs/prd.md` | Features et priorités (source de vérité produit) |
| Architecture | `docs/architecture/README.md` → fichiers modulaires (`data-models.md`, `api.md`, `frontend.md`, `backend.md`, `infrastructure.md`, `testing-conventions.md`, `checklist.md`) | Contraintes techniques, data models, API |
| UX Cartography | `docs/ux/ux-cartography.md` | Flows globaux, arborescence, composants, edge cases |
| UX Wireframes | `docs/ux/wireframes/README.md` → fichiers par écran (`E1-E2-auth.md`, `E5-E6-E7-onboarding.md`, `E8-hub.md`, `E9-lancement-aventure.md`, `E10-session-de-jeu.md`, `E11-ecran-de-fin.md`) | Wireframes détaillés par écran P1 |
