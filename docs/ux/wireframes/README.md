# JDRAI - Wireframes UX (Phase 2)

**Version :** 0.2
**Date :** 2026-02-06
**Auteur :** Sally (UX Expert, BMAD Method)
**Statut :** En cours
**Références :** `docs/prd.md` v1.3, `docs/ux/ux-cartography.md` v1.1

---

## Navigation

> **Comment utiliser cette documentation :**
> Chaque écran est documenté dans un fichier dédié. Commencez par les décisions transversales ci-dessous, puis consultez le fichier de l'écran concerné.

### Fichiers disponibles

| Fichier | Écran | Statut | Priorité |
| ------- | ----- | ------ | -------- |
| [`E10-session-de-jeu.md`](E10-session-de-jeu.md) | E10 — Session de jeu | Terminé (v0.1) | P1 |
| [`E8-hub.md`](E8-hub.md) | E8 — Hub | Terminé (v0.1) | P1 |
| [`E5-E6-E7-onboarding.md`](E5-E6-E7-onboarding.md) | E5/E6/E7 — Onboarding | Terminé (v0.1) | P1 |
| `E9-lancement-aventure.md` | E9 — Lancement aventure | _A venir_ | P1 |
| `E11-ecran-de-fin.md` | E11 — Ecran de fin | _A venir_ | P1 |
| `E1-E2-auth.md` | E1/E2 — Auth | _A venir_ | P1 |

### Ordre de conception UX

> Cet ordre concerne la conception UX uniquement. L'ordre de développement sera défini par l'architecte et le PO.

1. **E10** — Session de jeu (coeur produit)
2. **E8** — Hub (point d'entrée)
3. **E5/E6/E7** — Onboarding (première impression)
4. **E9** — Lancement aventure
5. **E11** — Ecran de fin
6. **E1/E2** — Auth (adaptation maquettes existantes)

---

## Décisions de design transversales

### Approche générale

| Décision              | Choix                   | Justification                                                                      |
| --------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| Approche              | Mobile-first            | PRD §5.3 — session de jeu = interaction chat/choix naturellement adaptée au mobile |
| Navigation en session | Sidebar/tab bar masquée | PRD §4.2 F2 — immersion totale pendant le jeu                                      |
| Thème visuel          | Dark fantasy            | UX Cartography §1.1 — tons chauds, textures parchemin, ambiance immersive          |

### Structure narrative : Milestones & Events

> **Origine :** Concept issu de la phase de discovery initiale (brainstorming fondateurs). Impacte la structure des aventures et plusieurs écrans (session, hub, lancement, fin).

**Hiérarchie narrative d'une aventure :**

```
AVENTURE "La Crypte des Ombres"
│
├── MILESTONE 1 — Réception de la quête
│   ├── Event : Arrivée à la taverne (obligatoire — intro)
│   ├── Event : Rencontre avec le marchand (optionnel)
│   └── Event : Discussion avec l'informateur (optionnel)
│
├── MILESTONE 2 — Entrée dans la crypte
│   ├── Event : Exploration de la grotte (optionnel)
│   ├── Event : Piège dans le couloir (optionnel)
│   └── Event : Découverte de la salle principale (obligatoire)
│
├── MILESTONE 3 — Confrontation finale
│   ├── Event : Négociation avec le gardien (optionnel)
│   └── Event : Combat final (obligatoire)
│
└── MILESTONE 4 — Résolution
    └── Event : Retour et récompenses (obligatoire)
```

| Concept       | Définition                                                                                                                                                 | Obligatoire ?                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Milestone** | Jalon narratif majeur qui structure l'aventure et en prédit la durée. Moment clé et (sauf exception) incontournable.                                       | Oui (sauf exceptions)                                 |
| **Event**     | Rencontre ou situation entre les milestones. Ponctue l'aventure. Le MJ guide le joueur, mais certains choix peuvent éloigner d'un event.                   | Non — certains sont obligatoires, d'autres optionnels |
| **Scène**     | Séquence cohérente d'échanges MJ-joueur avec un début et une fin naturels (ex : parler à un PNJ, explorer une pièce). Plusieurs scènes composent un event. | —                                                     |

**Impact UX :**

| Ecran                       | Impact                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| **E10 — Historique**        | Regroupement par milestones (P1), events à l'intérieur (P2+)                              |
| **E9 — Lancement aventure** | Durée estimée corrélée au nombre de milestones (courte = 2-3, longue = 6+)                |
| **E8 — Hub**                | Carte aventure en cours affiche le nom du milestone actuel (pas de progression numérique) |
| **E11 — Ecran de fin**      | Récap par milestones atteints (P1), events découverts (P2+)                               |

> **Règle de visibilité** : Jamais de progression numérique ("2/4", "%"). Seul le nom du milestone est affiché. Cf. UX Cartography §7.1 principe 6.

---

**Document généré via BMAD Method — Phase UX Phase 2 (Sally, UX Expert)**
