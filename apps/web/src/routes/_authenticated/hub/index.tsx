import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ActionCard, ActionCardSkeleton } from "@/components/hub/ActionCard";
import { AdventureCard } from "@/components/hub/AdventureCard";
import {
  AdventureCardActive,
  AdventureCardActiveSkeleton,
} from "@/components/hub/AdventureCardActive";
import { EmptyState } from "@/components/hub/EmptyState";
import { MetaCharacterBanner } from "@/components/hub/MetaCharacterBanner";
import { useActiveAdventures, useCompletedAdventures } from "@/hooks/useAdventures";
import { useCurrentUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/hub/")({
  component: HubPage,
});

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-stone-700/50 bg-stone-800/40 p-6 text-center space-y-4">
      <p className="text-amber-200/70">Impossible de charger vos aventures...</p>
      <button
        onClick={onRetry}
        className="text-sm text-amber-400 underline transition-colors hover:text-amber-300"
      >
        Réessayer
      </button>
    </div>
  );
}

function HubPage() {
  const navigate = useNavigate();

  const { data: user, isLoading: userLoading } = useCurrentUser();
  const {
    data: activeAdventures = [],
    isLoading: activeLoading,
    isError: activeError,
    refetch: refetchActive,
  } = useActiveAdventures();
  const { data: completedAdventures = [], isLoading: completedLoading } = useCompletedAdventures();

  const isLoading = userLoading || activeLoading || completedLoading;
  const hasActiveAdventures = activeAdventures.length > 0;
  const isAtLimit = activeAdventures.length >= 5;

  return (
    <div className="mx-auto max-w-3xl space-y-8 overflow-x-hidden px-4 py-6">
      {/* MetaCharacterBanner */}
      <MetaCharacterBanner user={user} isLoading={userLoading} />

      {/* Active adventures or empty state */}
      {isLoading ? (
        <AdventureCardActiveSkeleton />
      ) : activeError ? (
        <ErrorState onRetry={() => void refetchActive()} />
      ) : hasActiveAdventures ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-200/60">
            Aventures en cours
          </h2>
          <div className="space-y-4">
            {[...activeAdventures]
              .sort(
                (a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime(),
              )
              .map((adventure) => (
                <AdventureCardActive
                  key={adventure.id}
                  adventure={adventure}
                  onResume={() =>
                    void navigate({ to: "/adventure/$id", params: { id: adventure.id } })
                  }
                />
              ))}
          </div>
        </section>
      ) : (
        <EmptyState
          onLaunch={() => void navigate({ to: "/adventure/new" })}
          onTemplate={() => void navigate({ to: "/adventure/new", search: { mode: "template" } })}
        />
      )}

      {/* Action cards — always visible */}
      {isLoading ? (
        <ActionCardSkeleton />
      ) : (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-200/60">
            Nouvelle aventure
          </h2>
          <div className="flex flex-col gap-3 md:flex-row flex-wrap">
            <ActionCard
              icon="⚔️"
              label="Personnalisée"
              description="Choisissez votre thème, durée et difficulté"
              disabled={isAtLimit}
              onClick={() => void navigate({ to: "/adventure/new" })}
            />
            <ActionCard
              icon="📋"
              label="Scénario"
              description="Partez sur un scénario pré-conçu"
              disabled={isAtLimit}
              onClick={() => void navigate({ to: "/adventure/new", search: { mode: "template" } })}
            />
            <ActionCard
              icon="🎲"
              label="Aléatoire"
              description="Laissez le destin décider !"
              disabled={isAtLimit}
              onClick={() => void navigate({ to: "/adventure/new", search: { mode: "random" } })}
            />
          </div>
          {isAtLimit && (
            <p className="mt-2 text-xs text-amber-400/70">
              Limite de 5 aventures actives atteinte — abandonnez une aventure pour en créer une
              nouvelle.
            </p>
          )}
        </section>
      )}

      {/* History — only shown if completed adventures exist */}
      {!isLoading && completedAdventures.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-200/60">
              Aventures terminées
            </h2>
            {/* P2: "Tout >" will navigate to a dedicated list page */}
            <button className="text-xs text-amber-400/70 transition-colors hover:text-amber-400">
              Tout &gt;
            </button>
          </div>
          {/* Mobile: horizontal scroll carousel | Desktop: 4-col grid */}
          <div className="flex gap-3 overflow-x-auto snap-x pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {completedAdventures.slice(0, 5).map((adventure) => (
              <AdventureCard
                key={adventure.id}
                adventure={adventure}
                onClick={() =>
                  void navigate({
                    to: "/adventure/$id/summary",
                    params: { id: adventure.id },
                  })
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
