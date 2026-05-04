# JDRAI API — Audit de Refacto

> **Auteur** : Winston (Architect, BMAD)
> **Date** : 2026-05-04
> **Périmètre** : `apps/api/src/` (hors fichiers de test)
> **Méthodologie** : Audit en 3 axes — queries DB, responsabilités de couche, redondance transversale.
> **Architecture cible** : Conserver le vertical slicing par module, durcir la séparation `controller → service → repository`.

---

## Synthèse exécutive

| Axe | Constats | Sévérité globale |
|---|---|---|
| Queries DB hors repository | ~25 occurrences hors couche `*.repository.ts` | 🔴 Critique |
| Couplage transport (Socket.io) dans le service | 9 émissions `io.to(room).emit(...)` dans `game.service.ts` | 🔴 Critique |
| Module `reference` sans repository ni service | Queries directes dans le controller | 🔴 Critique |
| Vérifications d'autorisation dupliquées | 5 occurrences de `userId !== userId` | 🟠 Haute |
| `AppError` répétitifs | Messages `"Adventure not found"`, `"Not your adventure"` ×4–6 chacun | 🟠 Haute |
| Magic values (statuts, limites) | Statuts `"active"`, `"completed"`, etc. en strings dans tout le codebase | 🟠 Haute |
| Mapping DTO dupliqué | `MilestoneDTO` ×3, `AdventureCharacterDTO` ×2 | 🟡 Moyenne |
| Formatage de dates | `.toISOString()` dispersé (24 occurrences hors tests) | 🟡 Moyenne |
| Patterns hétérogènes (class vs functional) | Mix sans règle | 🟢 Faible |
| Bypass de couche dans `users.controller.ts` | Repository appelé directement | 🟢 Faible |

**Verdict global :** L'architecture par modules est saine, mais le module `game` concentre la majorité des dérives (couplage Socket.io, queries dispersées, autorisations dupliquées). `reference` est le module le moins mature (pas de repository, pas de service).

---

## 1. Centralisation des queries DB

> Règle cible : **toute query Drizzle doit vivre dans un fichier `*.repository.ts`**. Les services orchestrent, ne requêtent pas.

### 1.1 Module `game` — 🔴 CRITIQUE

**`game.service.ts` (8 raw queries)**

| Ligne | Query | Action |
|---|---|---|
| 347–351 | `select().from(adventures).where(eq(id))` | Déplacer → `getAdventureById(id, userId?)` |
| 363–367 | `select().from(adventureCharacters).where(eq(adventureId))` | Déplacer → `getAdventureCharacter(adventureId)` |
| 386–391 | `select(...).from(messages).where(eq(adventureId)).orderBy(desc).limit(20)` | Déplacer → `getRecentMessages(adventureId, limit)` |
| 561–565 | `select({username}).from(users).where(eq(id))` | **Cross-module** → `usersRepository.findById()` |
| 576 | `update(users).set({onboardingCompleted: true})` | **Cross-module** → `usersRepository.updateOnboardingStatus()` |
| 580–584 | `select({currentHp}).from(adventureCharacters)` | Couvert par `getAdventureCharacter()` |
| 683 / 688–689 | `db.query.races.findFirst` / `db.query.characterClasses.findFirst` | **Cross-module** → `referenceRepository.getRaceById()` / `getClassById()` |
| 698–701 | `update(adventures).set({state})` | Déplacer → `updateAdventureState()` (existe déjà partiellement) |
| 725–729 | `select().from(adventureCharacters)` | Couvert par `getAdventureCharacter()` |
| 821–825 | `select().from(adventures).where(eq(id))` | Couvert par `getAdventureById()` |
| 831–835 | `select().from(adventureCharacters)` | Couvert par `getAdventureCharacter()` |
| 838–843 | `select().from(messages).limit(50)` | Déplacer → `getMessages(adventureId, options)` |
| 895–899 | `select({id, userId}).from(adventures)` | Couvert par `getAdventureById()` |
| 904–913 | `select().from(messages).orderBy(asc).limit(100)` | Couvert par `getMessages(...)` |

**`game.controller.ts`**
- L. 123–125 : `db.query.adventures.findFirst(...)` → controller ne devrait pas requêter (cf. §2.1).
- L. 137–141 : `select({currentHp}).from(adventureCharacters)` → idem.

**`game.socket.ts`**
- L. 44–48 : `select({id}).from(adventures).where(and(eq(id), eq(userId)))` → déplacer vers `gameService.canUserJoinAdventure()` ou `gameRepository.verifyOwnership()`.

**Fonctions à ajouter dans `game.repository.ts`** :
- `getAdventureById(id: string, userId?: string)` — élimine 5 doublons
- `getAdventureCharacter(adventureId: string)` — élimine 5 doublons
- `getMessages(adventureId, options: { limit?, milestoneId?, order? })` — fusionne 3 variantes
- `getRecentMessages(adventureId, limit)` — usage `processAction`
- `verifyAdventureOwnership(adventureId, userId)` — usage socket `game:join`
- `updateAdventureState(adventureId, stateOrPatch)` — étendre l'existant pour couvrir le partial update L. 698

### 1.2 Module `adventures` — 🟠 HAUTE

**`adventures.service.ts`** :
| Ligne | Query | Action |
|---|---|---|
| 77–98 | `db.insert(milestones).values([...])` | Déplacer → `adventuresRepository.seedTutorialMilestones()` |
| 167–171 | `select().from(characterClasses).where(eq(isDefault))` | **Cross-module** → `referenceRepository.findDefaultClass()` |
| 177–178 | `select().from(races).where(eq(isDefault))` | **Cross-module** → `referenceRepository.findDefaultRace()` |
| 239–250 | `select(...).from(adventureTemplates)` | Déplacer → `adventuresRepository.getPublicTemplates()` |
| 291 | `db.delete(adventures).where(...)` | Déplacer → `adventuresRepository.deleteAdventure()` |

### 1.3 Module `reference` — 🔴 CRITIQUE

**`reference.controller.ts`** : queries DB **directement dans le controller** (lignes 11 et 16–19). Aucun service ni repository n'existe pour ce module.

**Action** :
1. Créer `reference.repository.ts` avec : `getAllRaces()`, `getAllClasses()`, `getRaceById(id)`, `getClassById(id)`, `findDefaultRace()`, `findDefaultClass()`.
2. Créer `reference.service.ts` qui mappe les rows en DTOs.
3. Le controller ne fait plus que `service.getRaces()` + format réponse.

> **Bonus** : ces données sont statiques post-seed → candidates au cache mémoire (cf. §6.1).

### 1.4 Module `meta-character` — 🟠 HAUTE

**`meta-character.service.ts`** :
- L. 35–36 et 39–44 : `db.query.races / characterClasses .findFirst({where: isDefault})` → `referenceRepository.findDefault*()`
- L. 82–88 et 85–89 : `db.query.races / characterClasses .findFirst({where: eq(id)})` → `referenceRepository.get*ById()`

**Repository absent** — toute la persistance vit dans le service. Créer `meta-character.repository.ts` :
- `createOrUpdateMetaCharacter(data)` (logique d'upsert actuelle)
- `getMetaCharacterByUserId(userId)`

### 1.5 Module `users` — 🟢 FAIBLE

`users.repository.ts` est minimaliste (`findById` uniquement). Ajouter :
- `updateOnboardingStatus(userId, completed)` — appelée depuis `game.service.ts:576` après tutoriel.

### 1.6 Module `auth` — ✅ CLEAN

Délègue intégralement à Better Auth. RAS.

---

## 2. Violations de responsabilités de couche

### 2.1 Logique métier dans les controllers — 🔴 CRITIQUE

#### `game.controller.ts` — `postSaveHandler` (L. 114–171)

Le handler exécute :
1. Query adventure (L. 123)
2. Vérification existence (L. 128)
3. Vérification ownership (L. 130)
4. Vérification statut métier (L. 133)
5. Query character HP (L. 137)
6. Extraction et validation `worldState` JSONB (L. 143–149)
7. Appel service
8. Format réponse

→ **À refacto** en `gameService.saveAdventure(adventureId, userId)` qui contient tout, controller réduit à 5 lignes.

#### `reference.controller.ts`

Queries DB directes (cf. §1.3).

#### `users.controller.ts` (L. 15)

Appelle `usersRepository.findById()` directement, court-circuitant le service. À remplacer par `usersService.getMe(userId)`.

### 2.2 Couplage transport (Socket.io) dans le service — 🔴 CRITIQUE

`game.service.ts` émet directement sur Socket.io (9 occurrences vérifiées) :

| Ligne | Évènement |
|---|---|
| 468 | `game:response-start` |
| 487, 504 | `game:chunk` |
| 511 | `game:error` |
| 553 | wrapper `io.to()` |
| 603 | `game:response-complete` |
| 639, 651, 663 | `game:state-update` (3 variantes) |

**Conséquences** :
- Service non-testable sans mock Socket.io.
- Service non-réutilisable hors contexte WebSocket (ex : job background, REST sync).
- Le `io` est passé en paramètre à `processAction()` depuis le controller (`game.controller.ts:63, 72-74`).

**Refacto recommandé — Pattern event-driven** :

```ts
// game.service.ts — retourne des events typés
async processAction(params): Promise<{
  messageId: string;
  response?: ProcessActionResponse;
  events: GameEvent[];
}> { /* … */ }

// game.socket.ts — émet
const result = await gameService.processAction(params);
result.events.forEach(e => io.to(room).emit(`game:${e.type}`, e.payload));
```

> Pour le streaming LLM (chunks), passer un `AsyncIterable<GameEvent>` ou un callback `onEvent` plutôt qu'un retour batch.

### 2.3 Mixed responsibility — `processAction` (L. 341–624)

La méthode fait : load DB ×3, D20, prompt building, LLM call, persistence message, parsing signaux, application HP/milestones/completion, émissions Socket, auto-save.

Phases bien découpées en l'état mais **trop volumineuse** (~280 lignes). Une fois le couplage Socket retiré (§2.2), envisager un découpage en sous-méthodes privées :
- `loadActionContext(adventureId, userId)`
- `runLLMTurn(context, action)` (renvoie events + signaux)
- `applySignalsAndPersist(signals, context)`

### 2.4 Socket handler `game:join` — 🟠 HAUTE

`game.socket.ts:44-48` exécute une query DB. Doit déléguer à `gameService.canUserJoinAdventure(adventureId, userId)`.

### 2.5 `users.controller.ts` — manipulation directe `set-cookie` — 🟢 FAIBLE

`res.setHeader("set-cookie", ...)` reste acceptable côté controller (transport HTTP) tant que la génération du cookie n'est pas dans le service.

---

## 3. Redondance transversale

### 3.1 Vérifications d'ownership dupliquées — 🟠 HAUTE

Vérifié : **5 occurrences** strictement identiques.

```
modules/game/game.controller.ts:130
modules/game/game.service.ts:354
modules/game/game.service.ts:828
modules/game/game.service.ts:902
routes/dev.router.ts:58
```

Toutes : `if (X.userId !== userId) throw new AppError(403, "FORBIDDEN", "Not your adventure")`.

**Stratégie recommandée** — encapsuler dans le repository :

```ts
// game.repository.ts (ou adventures.repository.ts)
export async function getAdventureByIdOrThrow(id: string, userId: string) {
  const row = await getAdventureById(id);
  if (!row) throw AppErrorFactory.adventureNotFound();
  if (row.userId !== userId) throw AppErrorFactory.notYourAdventure();
  return row;
}
```

→ supprime simultanément la duplication query + ownership + 404.

### 3.2 `AppError` dupliqués — 🟠 HAUTE

Compter au minimum :
- `"Adventure not found"` ×6
- `"Not your adventure"` ×5
- `"Character not found"` ×1+ (à vérifier exhaustivement)
- `"User not found"` ×1+

**Action** — créer une factory dans `utils/errors.ts` :

```ts
export const AppErrors = {
  adventureNotFound: () => new AppError(404, "NOT_FOUND", "Adventure not found"),
  notYourAdventure: () => new AppError(403, "FORBIDDEN", "Not your adventure"),
  characterNotFound: () => new AppError(404, "NOT_FOUND", "Character not found"),
  userNotFound: () => new AppError(404, "NOT_FOUND", "User not found"),
  adventureNotActive: () => new AppError(400, "ADVENTURE_NOT_ACTIVE", "Cannot act on a completed adventure"),
  validationFailed: (msg: string) => new AppError(400, "VALIDATION_ERROR", msg),
} as const;
```

> Bonus : codes d'erreur centralisés → typage strict des `ErrorCode` côté frontend via `@jdrai/shared`.

### 3.3 Magic values (statuts, limites) — 🟠 HAUTE

**Statuts en string littérale** (échantillon) :
- `adventures.status === "active"` → `adventures.repository.ts:35`, `service.ts:213`, `game.controller.ts:133`, `game.service.ts:355, 798`
- `milestones.status === "active"` → `adventures.repository.ts:89`, `game.repository.ts:68`, `game.service.ts:384`, `prompt-builder.ts:421`

**Limites numériques dispersées** :
- `MAX_ACTIVE_ADVENTURES = 5` dans `adventures.service.ts:28`
- `MAX_HISTORY_MESSAGES = 20` dans `prompt-builder.ts:79`
- Limites de messages (20, 50, 100) inline dans les queries

**Action** — `config/enums.ts` (ou enrichir `config/constants.ts`) :

```ts
export const ADVENTURE_STATUS = { ACTIVE: "active", COMPLETED: "completed", ABANDONED: "abandoned" } as const;
export const MILESTONE_STATUS = { PENDING: "pending", ACTIVE: "active", COMPLETED: "completed" } as const;

export const VALID_ADVENTURE_TRANSITIONS = {
  active: ["completed", "abandoned"],
  completed: [],
  abandoned: [],
} as const;

export const LIMITS = {
  MAX_ACTIVE_ADVENTURES: 5,
  MAX_HISTORY_MESSAGES: 20,
  RECENT_MESSAGES_FOR_ACTION: 20,
  STATE_RESYNC_MESSAGE_COUNT: 50,
  GET_MESSAGES_PAGE_SIZE: 100,
} as const;
```

> ⚠️ Si les types Drizzle de la colonne `status` sont déjà des unions stricts (cf. `pgEnum`), les constantes restent utiles pour la lisibilité mais le typage est déjà sécurisé.

### 3.4 Mapping DTO dupliqué — 🟡 MOYENNE

#### `MilestoneDTO` ×3
- `game.repository.ts:49-60` (`getMilestones`)
- `game.repository.ts:73-82` (`getActiveMilestone`)
- `adventures.repository.ts:187-198` (`getAdventureMilestones`)

→ Extraire `toMilestoneDTO(row)` dans `modules/game/game.dto.ts` (ou un `utils/dtos.ts` partagé si plusieurs modules le consomment).

#### `AdventureCharacterDTO` ×2
- `adventures.service.ts:37-50` (`mapRowToDTO`)
- `game.service.ts:107-120` (`buildAdventureDTO`)

→ Promouvoir vers `adventures.dto.ts` (DTO partagé entre modules `adventures` et `game`).

### 3.5 Formatage de dates — 🟡 MOYENNE

**24 occurrences** vérifiées de `.toISOString()` (hors tests). Helper `toISOString()` existe dans `utils/http.ts` mais sous-utilisé (1 seul site).

Patterns récurrents :
- `new Date().toISOString()` dans middleware (error, rate-limit) et controllers — candidat à `getCurrentISOString()`.
- `row.field?.toISOString()` conditionnel dans tous les mapping DTO — candidat à un helper `toISOStringOrUndefined(date)`.

### 3.6 Patterns hétérogènes (class vs functional) — 🟢 FAIBLE

| Pattern | Modules |
|---|---|
| Class + singleton export | `auth`, `meta-character` |
| Class sans singleton | `game` (`GameService`), `game/d20`, `game/llm` |
| Functions exportées | `adventures`, `game.repository`, `users.repository` |
| Object literal | `users.service` (`const usersService = { ... }`) |

**Recommandation** : choisir une règle :
- **Repositories** : toujours functions exportées (cohérent avec `game.repository.ts`).
- **Services** : classe + singleton si état/dépendances injectées, sinon functions exportées. Documenter dans `tech-debt.md` ou un `CONTRIBUTING.md`.

### 3.7 Validation Zod — 🟢 FAIBLE

2 occurrences seulement (`game.controller.ts:53, 186`), mêmes 4 lignes répétées :
```ts
if (!parsed.success) throw new AppError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "...")
```

→ Helper `validateOrThrow(schema, input)` dans `utils/validation.ts` quand le 3ᵉ usage apparaît.

---

## 4. Plan de refacto recommandé (par phases)

> **Principe** : phases indépendantes et déployables séparément. Chaque phase = un PR. Tests à mettre à jour au fil de l'eau.

### Phase 1 — Fondations transversales (effort : S)

**Livrables** :
- `utils/errors.ts` → ajouter `AppErrors` factory.
- `config/enums.ts` (ou enrichir `constants.ts`) → `ADVENTURE_STATUS`, `MILESTONE_STATUS`, `LIMITS`, `VALID_ADVENTURE_TRANSITIONS`.
- `utils/http.ts` → `getCurrentISOString()`, `toISOStringOrUndefined()`.

**Impact** : 0 changement comportemental, prépare les phases suivantes.

### Phase 2 — Module `reference` (effort : S)

- Créer `reference.repository.ts` + `reference.service.ts`.
- `reference.controller.ts` → délégation pure.
- Mettre à jour `adventures.service.ts`, `meta-character.service.ts`, `game.service.ts` pour utiliser `referenceRepository.*` (supprime 8+ queries cross-module).

### Phase 3 — `game.repository.ts` étendu (effort : M)

Ajouter les fonctions :
- `getAdventureById(id, userId?)`
- `getAdventureByIdOrThrow(id, userId)` ← intègre 404 + 403
- `getAdventureCharacter(adventureId)`
- `getMessages(adventureId, options)`
- `getRecentMessages(adventureId, limit)`
- `verifyAdventureOwnership(adventureId, userId)`

**Réécrire** `game.service.ts` et `game.controller.ts` pour les consommer → supprime 12+ queries dispersées + 4 vérifications d'ownership.

### Phase 4 — Découplage Socket.io (effort : L)

- Définir `GameEvent` dans `@jdrai/shared` (types partagés frontend).
- Refacto `processAction` → renvoie events ou expose un `AsyncIterable<GameEvent>` pour le streaming.
- `game.controller.ts` (HTTP) et `game.socket.ts` (WebSocket) consomment et émettent.
- Suppression du paramètre `io` dans la signature du service.

**Bénéfice** : service testable sans Socket.io, possibilité d'un mode REST polling pour debugging/CLI.

### Phase 5 — `meta-character` repository + `users.updateOnboardingStatus` (effort : S)

- Créer `meta-character.repository.ts` (extraire upsert).
- Étendre `users.repository.ts` avec `updateOnboardingStatus`.
- Nettoyer les queries cross-module dans `game.service.ts` (L. 561-576).

### Phase 6 — DTOs et helpers (effort : S)

- Extraire `toMilestoneDTO()` (×3 sites).
- Extraire `toAdventureCharacterDTO()` (×2 sites).
- Promouvoir les helpers vers `*.dto.ts` modules.

### Phase 7 — Cohérence patterns service (effort : S, optionnel)

- Choisir et documenter (class vs functional).
- Aligner les modules existants OU consigner la dette dans `docs/architecture/tech-debt.md`.

---

## 5. Priorités consolidées

| # | Action | Sévérité | Effort | Impact |
|---|---|---|---|---|
| 1 | Découpler Socket.io de `game.service.ts` | 🔴 | L | Testabilité, réutilisation |
| 2 | Créer `reference.repository.ts` + `reference.service.ts` | 🔴 | S | Élimine cross-module queries |
| 3 | Centraliser queries `game` (adventure/character/messages) | 🔴 | M | -12 queries dispersées |
| 4 | Refacto `postSaveHandler` (controller → service) | 🔴 | S | Couche respectée |
| 5 | `AppErrors` factory + `getAdventureByIdOrThrow` | 🟠 | S | -10 doublons en cascade |
| 6 | Constantes pour statuts + limites | 🟠 | S | Lisibilité, typage |
| 7 | `meta-character.repository.ts` | 🟠 | S | Cohérence modulaire |
| 8 | DTOs extraits (`toMilestoneDTO`, etc.) | 🟡 | S | -5 mappings dupliqués |
| 9 | `users.repository.updateOnboardingStatus` | 🟡 | XS | Élimine 1 cross-module |
| 10 | Helpers date (`getCurrentISOString`, etc.) | 🟢 | XS | Cosmétique |
| 11 | Standardiser class vs functional services | 🟢 | M | Cohérence (optionnel) |

---

## 6. Notes complémentaires

### 6.1 Cache des données de référence

Les tables `races` et `characterClasses` sont **statiques post-seed**. Une fois `reference.repository.ts` en place, candidate naturel à un cache mémoire (`Map<id, row>` chargé au boot, invalidation manuelle). Gain estimé : ~10–15 queries DB par session de jeu.

À documenter dans `docs/architecture/tech-debt.md` si reporté.

### 6.2 Liaison avec la dette technique connue

Cohérent avec :
- **TD-006** (`onboarding_completed`) — la décision de câbler ou supprimer ce champ s'imbrique avec la Phase 5 (refacto `users.updateOnboardingStatus`).
- L'introduction d'un `core/` n'est pas nécessaire pour cette refacto. À reconsidérer uniquement si Phase 4 introduit un besoin d'interfaces (`IGameRepository`, `ILLMProvider` déjà existant).

### 6.3 Tests

Chaque phase doit s'accompagner de :
- Tests unitaires repository (intégration DB) **avant** suppression des queries dans services.
- Mise à jour des tests services pour utiliser des mocks de repository plutôt que la DB réelle là où pertinent.
- Vérification des intégrations existantes (`game.service.integration.test.ts` couvre déjà beaucoup).

---

**Fin du rapport.** Ce document est un point de départ — chaque phase peut être affinée en story BMAD séparée si nécessaire.
