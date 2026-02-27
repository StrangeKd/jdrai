import type { AdventureTemplateDTO } from "@jdrai/shared";

import { TemplateCard, TemplateCardSkeleton } from "@/components/adventure/TemplateCard";

interface AdventureTemplatesViewProps {
  templates: AdventureTemplateDTO[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onChoose: (template: AdventureTemplateDTO) => void;
}

export function AdventureTemplatesView({
  templates,
  isLoading,
  isError,
  onRetry,
  onChoose,
}: AdventureTemplatesViewProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-amber-100">Choisissez un scénario</h2>

      {isLoading && (
        <div className="space-y-4">
          <TemplateCardSkeleton />
          <TemplateCardSkeleton />
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-lg border border-stone-700 bg-stone-800/30 p-4 text-center">
          <p className="text-sm text-stone-400">Impossible de charger les scénarios.</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-sm text-amber-400 underline hover:text-amber-300"
          >
            Réessayer
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1 lg:max-h-128">
          {templates.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} onChoose={onChoose} />
          ))}
        </div>
      )}
    </div>
  );
}
