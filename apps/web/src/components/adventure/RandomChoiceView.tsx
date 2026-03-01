import { Button } from "@/components/ui/button";

interface RandomChoiceViewProps {
  onReveal: () => void;
  onAccept: () => void;
}

/** WF-E9-03b — Random mode surprise choice: reveal params or accept the unknown. */
export function RandomChoiceView({ onReveal, onAccept }: RandomChoiceViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center px-6">
      <span className="text-6xl" aria-hidden="true">
        🎲
      </span>
      <div>
        <h2 className="text-2xl font-bold text-amber-100 mb-2">Le destin a parlé.</h2>
        <p className="text-stone-300">Souhaitez-vous connaître ce qui vous attend&nbsp;?</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={onReveal} className="w-full uppercase tracking-wider">
          RÉVÉLER MON DESTIN
        </Button>
        <Button
          variant="outline"
          onClick={onAccept}
          className="w-full uppercase tracking-wider border-stone-600 text-stone-900 hover:text-stone-100 hover:bg-stone-400"
        >
          ACCEPTER L&apos;INCONNU
        </Button>
      </div>
    </div>
  );
}
