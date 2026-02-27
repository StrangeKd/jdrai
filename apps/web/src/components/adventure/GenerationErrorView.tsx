import { Button } from "@/components/ui/button";

interface GenerationErrorViewProps {
  onRetry: () => void;
  onBack: () => void;
}

/** WF-E9-05 — Generation failure screen after 3 consecutive POST failures. */
export function GenerationErrorView({ onRetry, onBack }: GenerationErrorViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-6">
      <span className="text-5xl" aria-hidden="true">⚠️</span>
      <p className="text-lg text-stone-300">
        Le Maître du Jeu n&apos;a pas pu préparer votre aventure.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={onRetry} className="w-full uppercase tracking-wider">
          RÉESSAYER
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-stone-400 hover:text-stone-200 transition-colors"
        >
          Retour à la configuration
        </button>
      </div>
    </div>
  );
}
