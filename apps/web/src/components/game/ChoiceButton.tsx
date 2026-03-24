/**
 * ChoiceButton — a single RPG choice option button (Story 6.4 Task 6).
 *
 * AC: #6, #8 — renders a full-width choice button with index prefix, handles disabled state.
 */
import type { SuggestedAction } from "@jdrai/shared";

import { Button } from "@/components/ui/button";

interface ChoiceButtonProps {
  choice: SuggestedAction;
  index: number;
  disabled: boolean;
  onSelect: (choice: SuggestedAction) => void;
}

export function ChoiceButton({ choice, index, disabled, onSelect }: ChoiceButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start text-left text-amber-100 border-amber-700/50 bg-stone-900/60 hover:bg-amber-900/30 hover:border-amber-500/60 disabled:opacity-40 h-auto py-3 px-4 whitespace-normal"
      disabled={disabled}
      onClick={() => onSelect(choice)}
    >
      <span className="text-amber-400/70 mr-2 font-mono text-sm shrink-0">{index + 1}.</span>
      <span>{choice.label}</span>
    </Button>
  );
}
