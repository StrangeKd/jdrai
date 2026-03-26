/**
 * LLMErrorMessage — thematic error state shown when LLM backend fails (Story 6.8 Task 6).
 *
 * Replaces LoadingNarration/StreamingText when hasLLMError=true.
 * FreeInput is re-enabled on this state so the player can reformulate.
 *
 * AC: #5, #6
 */
import { Button } from "@/components/ui/button";

interface LLMErrorMessageProps {
  visible: boolean;
  onRetry: () => void;
}

export function LLMErrorMessage({ visible, onRetry }: LLMErrorMessageProps) {
  if (!visible) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <span className="text-4xl">🪣</span>
      <p className="font-serif text-amber-200/80 italic leading-relaxed">
        Le MJ a renversé son encrier...
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="border-amber-600/50 text-amber-200 hover:bg-amber-900/30"
      >
        Réessayer
      </Button>
    </div>
  );
}
