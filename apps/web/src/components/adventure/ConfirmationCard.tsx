import type { Difficulty, EstimatedDuration } from "@jdrai/shared";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Facile",
  normal: "Normal",
  hard: "Difficile",
  nightmare: "Cauchemar",
};

const DURATION_LABELS: Record<EstimatedDuration, string> = {
  short: "Courte (~20 min)",
  medium: "Moyenne (~45 min)",
  long: "Longue (~1h+)",
};

interface ConfirmationCardProps {
  duration: EstimatedDuration;
  difficulty: Difficulty;
  characterName: string;
  templateName?: string;
}

export function ConfirmationCard({
  duration,
  difficulty,
  characterName,
  templateName,
}: ConfirmationCardProps) {
  return (
    <div className="rounded-lg border border-stone-700 bg-stone-800/40 p-5 space-y-3">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-lg" aria-hidden="true">📖</span>
        <div>
          <span className="text-stone-400 text-xs uppercase tracking-wide">Univers</span>
          <p className="text-amber-100 font-medium">Heroic Fantasy</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-lg" aria-hidden="true">⏱️</span>
        <div>
          <span className="text-stone-400 text-xs uppercase tracking-wide">Durée</span>
          <p className="text-amber-100 font-medium">{DURATION_LABELS[duration]}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-lg" aria-hidden="true">⚖️</span>
        <div>
          <span className="text-stone-400 text-xs uppercase tracking-wide">Difficulté</span>
          <p className="text-amber-100 font-medium">{DIFFICULTY_LABELS[difficulty]}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-lg" aria-hidden="true">🧙</span>
        <div>
          <span className="text-stone-400 text-xs uppercase tracking-wide">Personnage</span>
          <p className="text-amber-100 font-medium">{characterName}</p>
        </div>
      </div>

      {templateName && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-lg" aria-hidden="true">🗺️</span>
          <div>
            <span className="text-stone-400 text-xs uppercase tracking-wide">Scénario</span>
            <p className="text-amber-100 font-medium">{templateName}</p>
          </div>
        </div>
      )}
    </div>
  );
}
