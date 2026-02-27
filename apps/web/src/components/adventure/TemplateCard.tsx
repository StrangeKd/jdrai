import type { AdventureTemplateDTO, Difficulty, EstimatedDuration } from "@jdrai/shared";

import { Button } from "@/components/ui/button";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Facile",
  normal: "Normal",
  hard: "Difficile",
  nightmare: "Cauchemar",
};

const DURATION_LABELS: Record<EstimatedDuration, string> = {
  short: "~20 min",
  medium: "~45 min",
  long: "~1h+",
};

interface TemplateCardProps {
  template: AdventureTemplateDTO;
  onChoose: (template: AdventureTemplateDTO) => void;
}

export function TemplateCard({ template, onChoose }: TemplateCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-stone-700 bg-stone-800/40 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          🗺️
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-100 leading-tight">{template.name}</h3>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-stone-400">
            <span>{template.genre}</span>
            <span>·</span>
            <span>{DURATION_LABELS[template.estimatedDuration]}</span>
            <span>·</span>
            <span>{DIFFICULTY_LABELS[template.difficulty]}</span>
          </div>
        </div>
      </div>

      {/* Description truncated to 2 lines */}
      <p className="text-sm text-stone-300 line-clamp-2">{template.description}</p>

      <Button
        variant="outline"
        size="sm"
        className="w-full bg-amber-900 border-amber-700 text-amber-200 hover:bg-amber-900/40 hover:text-amber-100 uppercase tracking-wider"
        onClick={() => onChoose(template)}
      >
        CHOISIR
      </Button>
    </div>
  );
}

/** Loading skeleton for TemplateCard */
export function TemplateCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-stone-700/50 bg-stone-800/20 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="size-8 rounded bg-stone-700/60" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-stone-700/60" />
          <div className="h-3 w-1/2 rounded bg-stone-700/40" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="h-3 w-full rounded bg-stone-700/40" />
        <div className="h-3 w-4/5 rounded bg-stone-700/40" />
      </div>
      <div className="h-8 w-full rounded bg-stone-700/40" />
    </div>
  );
}
