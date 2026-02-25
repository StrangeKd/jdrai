# JDRAI — Tech Debt & Compatibility Notes

**Version:** 1.0
**Date:** 2026-02-24
**Statut:** Document vivant — mettre à jour au fil des découvertes

---

## Vue d'ensemble

Ce document recense les dettes techniques connues, incompatibilités de versions, et corrections à anticiper pour les prochains composants ou upgrades de dépendances.

---

## [TD-001] shadcn/ui — `forwardRef` requis sous React 18

**Statut:** ⚠️ Partiellement corrigé (Dialog uniquement)
**Sévérité:** Moyenne — warning console, pas de crash

### Contexte

Le CLI shadcn génère désormais des composants en style **React 19** (fonctions simples sans `forwardRef`). Or le projet tourne sur **React 18**, qui requiert `React.forwardRef` pour les composants recevant des refs via les mécanismes internes de Radix UI (`Primitive.div.SlotClone`, composant `Presence` pour les animations).

**Symptôme:**
```
Warning: Function components cannot be given refs. Attempts to access this ref will fail.
Did you mean to use React.forwardRef()?
Check the render method of `Primitive.div.SlotClone`.
```

### Correction appliquée

`apps/web/src/components/ui/dialog.tsx` — `DialogOverlay` et `DialogContent` convertis en `React.forwardRef` (2026-02-24).

### Composants susceptibles d'être affectés

Tous les composants shadcn qui wrappent un primitif Radix UI avec animations de présence (enter/exit) sont concernés lors de leur ajout :

| Composant shadcn      | Primitifs Radix concernés                        | Priorité |
| --------------------- | ------------------------------------------------ | -------- |
| `alert-dialog`        | `AlertDialogOverlay`, `AlertDialogContent`       | Haute    |
| `sheet`               | `SheetOverlay`, `SheetContent`                   | Haute    |
| `popover`             | `PopoverContent`                                 | Haute    |
| `tooltip`             | `TooltipContent`                                 | Haute    |
| `dropdown-menu`       | `DropdownMenuContent`, `DropdownMenuSubContent`  | Haute    |
| `context-menu`        | `ContextMenuContent`, `ContextMenuSubContent`    | Moyenne  |
| `hover-card`          | `HoverCardContent`                               | Moyenne  |
| `menubar`             | `MenubarContent`, `MenubarSubContent`            | Moyenne  |
| `navigation-menu`     | `NavigationMenuContent`                          | Moyenne  |
| `select`              | `SelectContent`                                  | Haute    |
| `toast` / `sonner`    | Selon implémentation                             | Moyenne  |
| `command`             | `CommandDialog` (wraps Dialog)                   | Moyenne  |

### Action requise à chaque ajout de composant shadcn

Après `pnpm dlx shadcn@latest add <composant>`, inspecter le fichier généré et appliquer `React.forwardRef` sur les composants qui :
1. Wrappent un `*Primitive.Content`, `*Primitive.Overlay`, `*Primitive.SubContent`
2. Sont utilisés comme enfants d'un `Primitive.Portal` ou d'une `Presence`

**Pattern de correction :**

```tsx
// AVANT (généré par CLI — style React 19)
function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay ref={...} className={cn(...)} {...props} />
}

// APRÈS (compatible React 18)
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cn(...)} {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName
```

### Résolution définitive

Upgrader vers **React 19** supprime entièrement ce problème (refs passées comme props normales). À évaluer quand l'écosystème majeur (TanStack, Better Auth, etc.) sera stable sur React 19.

---

## [TD-002] Zod v4 — migration à surveiller

**Statut:** ⏳ En attente (non bloquant)
**Sévérité:** Faible — warning peer dependency uniquement

### Contexte

`better-call 1.1.8` (dépendance transitive de `better-auth`) déclare `zod@^4.0.0` comme peer dependency. Le projet utilise actuellement `zod@^3.x` (en réalité `zod@^4.3.6` selon `package.json` — déjà sur v4).

> **Note:** Vérifier si cette dette est déjà résolue (`package.json` indique `"zod": "^4.3.6"`).

### Action requise

Surveiller le changelog de `better-auth` pour l'upgrade de sa dépendance `better-call` vers une version qui requiert explicitement zod v4. Tester la compatibilité de `@/lib/validation.ts` après tout upgrade de `better-auth`.

---

## [TD-003] Tailwind CSS v4 — classes utilitaires à valider

**Statut:** ⚠️ À surveiller
**Sévérité:** Faible

### Contexte

Le projet utilise **Tailwind CSS v4** (`^4.2.0`), qui introduit des changements de comportement par rapport à v3 (notamment la gestion des conflits de classes via `tailwind-merge`, les classes `ring-offset-*` dépréciées, `rounded-xs` remplaçant `rounded-sm` dans certains contextes).

### Points de vigilance

- `tailwind-merge` doit être à jour pour reconnaître les nouvelles classes v4
- Les composants shadcn générés peuvent inclure des classes v3 (`ring-offset-background`, `outline-hidden`, `zoom-out-95`) — vérifier leur rendu si des anomalies visuelles apparaissent
- La directive `@apply` est modifiée en v4 — ne pas l'utiliser dans les composants custom sans vérification

---

## [TD-004] Route `$id.summary.tsx` — convention à confirmer

**Statut:** ✅ Validé (typecheck passe)
**Sévérité:** Faible

### Contexte

TanStack Router v1 utilise la notation `.` pour les routes flat-file imbriquées. La route `/_authenticated/adventure/$id/summary` est définie dans `$id.summary.tsx`. Le typecheck passe, mais la convention exacte (vs `$id_.summary.tsx` pour pathless layout) mérite confirmation lors de l'implémentation réelle (Story 6.4 / 7.2).

### Action requise

À la Story 6.4, vérifier que `routeTree.gen.ts` génère bien `/_authenticated/adventure/$id/summary` (et non `/_authenticated/adventure/$id_/summary`) et que le param `$id` est correctement résolu dans le composant via `Route.useParams()`.

---

## Processus de mise à jour

Ce document doit être mis à jour :
- Lors de l'ajout d'un nouveau composant shadcn (TD-001)
- Lors d'un upgrade majeur de dépendance (zod, React, TanStack, better-auth)
- Lors de la découverte d'un nouveau warning/incompatibilité en développement
- Lors de la résolution d'un item (mettre le statut à ✅ Résolu avec la date)
