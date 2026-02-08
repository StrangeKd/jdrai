# JDRAI — Documentation UX

**Auteur :** Sally (UX Expert, BMAD Method)
**Référence PRD :** `docs/prd.md` v1.4

---

## Structure du dossier

```
docs/ux/
├── README.md                  ← Ce fichier (index UX)
├── ux-cartography.md          ← Phase 1 : Cartographie UX
└── wireframes/                ← Phase 2 : Wireframes détaillés
    ├── README.md              ← Index wireframes + décisions transversales
    ├── E1-E2-auth.md          ← Auth (login, register, forgot/reset pwd)
    ├── E5-E6-E7-onboarding.md ← Onboarding (welcome, pseudo, tutoriel)
    ├── E8-hub.md              ← Hub (écran central post-auth)
    ├── E9-lancement-aventure.md ← Lancement aventure (config, templates, aléatoire)
    ├── E10-session-de-jeu.md  ← Session de jeu (coeur produit)
    └── E11-ecran-de-fin.md    ← Écran de fin (résumé, milestones, récompenses)
```

---

## Documents et leur rôle

| Document | Version | Rôle | Quand le consulter |
| --- | --- | --- | --- |
| **`ux-cartography.md`** | v1.1 | Source de vérité UX : user flows, arborescence, inventaire écrans et composants, états et edge cases, recommandations | Comprendre les flows globaux, les composants disponibles, les règles de navigation, les edge cases transversaux |
| **`wireframes/README.md`** | v0.3 | Index des wireframes + décisions de design transversales (mobile-first, milestones & events) | Avant de consulter un wireframe spécifique, pour comprendre les décisions partagées |
| **`wireframes/E*.md`** | v0.1 | Wireframes détaillés par écran : anatomie, mobile, desktop, erreurs, interactions, règles | Concevoir, développer ou tester un écran spécifique |

---

## Workflow de lecture recommandé

1. **Contexte global** → Lire `ux-cartography.md` (§2 flows, §3 arborescence, §5 composants)
2. **Décisions transversales** → Lire `wireframes/README.md` (mobile-first, milestones, navigation)
3. **Écran spécifique** → Lire le fichier wireframe correspondant (`wireframes/E*.md`)

> **Règle pour les agents :** Ne jamais charger tous les fichiers wireframes d'un coup. Identifier l'écran concerné et ne charger que le fichier nécessaire.

---

## Phases UX

| Phase | Statut | Contenu |
| --- | --- | --- |
| **Phase 1 — Cartographie** | Terminée | Flows, arborescence, inventaire écrans/composants, edge cases, recommandations |
| **Phase 2 — Wireframes** | Terminée (v0.1, en review) | Wireframes détaillés pour tous les écrans P1 (E1-E11) |
| **Phase 3 — Spécifications front-end** | À venir | Specs techniques pour génération UI |

---

## Conventions

### Structure des fichiers wireframes

Chaque fichier wireframe suit une structure à **7 sections** :

1. **Décisions spécifiques** — Choix de design propres à l'écran
2. **Anatomie de l'écran** — Schéma structurel simplifié
3. **Wireframes mobile (< 768px)** — Wireframes ASCII détaillés
4. **États d'erreur et edge cases** — Wireframes des états non-nominaux
5. **Wireframes desktop (> 1024px)** — Adaptation desktop
6. **Interactions et transitions** — Flows et tableau d'interactions
7. **Règles de comportement** — Règles métier et UX de l'écran

### Header standard

Chaque fichier commence par : Route, Priorité, Complexité, Référence composants, Parent.

---

## Liens rapides par sujet

| Sujet | Où chercher |
| --- | --- |
| **Flows utilisateur** | `ux-cartography.md` §2 |
| **Arborescence des routes** | `ux-cartography.md` §3.1 |
| **Règles de navigation (sidebar/tab bar)** | `ux-cartography.md` §3.2 |
| **Inventaire des composants** | `ux-cartography.md` §5 |
| **Milestones & Events** | `ux-cartography.md` §2.6 + `wireframes/README.md` |
| **Compagnon / Mascotte (P3)** | `ux-cartography.md` §7.2 |
| **Accessibilité** | `ux-cartography.md` §7.4 |
| **Responsive breakpoints** | `ux-cartography.md` §7.5 |
| **Maquettes existantes** | `ux-cartography.md` §1.2 + `mockups/` |

---

**Document généré via BMAD Method — Phase UX (Sally, UX Expert)**
