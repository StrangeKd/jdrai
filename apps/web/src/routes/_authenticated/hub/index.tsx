import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import type { UserDTO } from "@jdrai/shared";

import { ActionCard, ActionCardSkeleton } from "@/components/hub/ActionCard";
import { AdventureCard } from "@/components/hub/AdventureCard";
import {
  AdventureCardActive,
  AdventureCardActiveSkeleton,
} from "@/components/hub/AdventureCardActive";
import { EmailVerificationBanner } from "@/components/hub/EmailVerificationBanner";
import { EmptyState } from "@/components/hub/EmptyState";
import { MetaCharacterBanner } from "@/components/hub/MetaCharacterBanner";
import { Button } from "@/components/ui/button";
import { useActiveAdventures, useCompletedAdventures } from "@/hooks/useAdventures";
import { useCurrentUser } from "@/hooks/useUser";

export const Route = createFileRoute("/_authenticated/hub/")({
  component: HubPage,
});

/** Shows EmailVerificationBanner if email not yet verified. One banner at a time. */
function HubBanner({ user }: { user: UserDTO | undefined }) {
  if (!user) return null;
  if (!user.emailVerified) return <EmailVerificationBanner email={user.email} />;
  return null;
}

function ErrorState({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div className="rounded-xl border border-stone-700/50 bg-stone-800/40 p-6 text-center space-y-4">
      <p className="text-amber-200/70">{message}</p>
      <Button
        onClick={onRetry}
        className="text-sm text-amber-400 underline transition-colors hover:text-amber-300"
      >
        Réessayer
      </Button>
    </div>
  );
}

export function HubPage() {
  const navigate = useNavigate();

  // AC-6: reconnection toast — shown once per session after login redirect
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("just-logged-in");
    if (justLoggedIn === "true") {
      sessionStorage.removeItem("just-logged-in");
      toast.success("✓ Reconnecté ! Bon retour.", { duration: 3000 });
    }
  }, []);

  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
    refetch: refetchUser,
  } = useCurrentUser();
  const {
    data: activeAdventures = [],
    isLoading: activeLoading,
    isError: activeError,
    refetch: refetchActive,
  } = useActiveAdventures();
  const {
    data: completedAdventures = [],
    isLoading: completedLoading,
    isError: completedError,
    refetch: refetchCompleted,
  } = useCompletedAdventures();

  const isPrimaryLoading = userLoading || activeLoading;
  const hasActiveAdventures = activeAdventures.length > 0;
  const isAtLimit = activeAdventures.length >= 5;
  const sortedActiveAdventures = [...activeAdventures].sort(
    (a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime(),
  );
  const visibleActiveAdventures = sortedActiveAdventures.slice(0, 5);

  const canShowHubContent = !isPrimaryLoading && !(userError && !user) && !activeError;
  const retryAll = () => {
    void refetchUser();
    void refetchActive();
    void refetchCompleted();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 overflow-x-hidden px-4 py-6">
      {/* MetaCharacterBanner */}
      <MetaCharacterBanner user={user} isLoading={userLoading && !user} />

      {/* Hub banners — priority: profile incomplete > email unverified > nothing */}
      <HubBanner user={user} />

      {/* Active adventures or empty state */}
      {isPrimaryLoading ? (
        <AdventureCardActiveSkeleton />
      ) : userError && !user ? (
        <ErrorState message="Impossible de charger votre profil..." onRetry={retryAll} />
      ) : activeError ? (
        <ErrorState message="Impossible de charger vos aventures..." onRetry={retryAll} />
      ) : hasActiveAdventures ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-200/60">
            Aventures en cours
          </h2>
          <div className="space-y-4">
            {visibleActiveAdventures.map((adventure) => (
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
          onLaunch={() => void navigate({ to: "/adventure/new", search: { mode: "custom" } })}
          onTemplate={() => void navigate({ to: "/adventure/new", search: { mode: "templates" } })}
        />
      )}

      {/* Action cards — always visible */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-amber-200/60">
          Nouvelle aventure
        </h2>
        {isPrimaryLoading ? (
          <ActionCardSkeleton />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <ActionCard
              icon="⚔️"
              label="Personnalisée"
              description="Choisissez votre thème, durée et difficulté"
              disabled={isAtLimit}
              onClick={() => void navigate({ to: "/adventure/new", search: { mode: "custom" } })}
            />
            <ActionCard
              icon="📋"
              label="Scénario"
              description="Partez sur un scénario pré-conçu"
              disabled={isAtLimit}
              onClick={() => void navigate({ to: "/adventure/new", search: { mode: "templates" } })}
            />
            <ActionCard
              icon="🎲"
              label="Aléatoire"
              description="Laissez le destin décider !"
              disabled={isAtLimit}
              onClick={() => void navigate({ to: "/adventure/new", search: { mode: "random" } })}
            />
          </div>
        )}
        {!isPrimaryLoading && isAtLimit && (
          <p className="mt-2 text-xs text-amber-400/70">
            Limite de 5 aventures actives atteinte — abandonnez une aventure pour en créer une
            nouvelle.
          </p>
        )}
      </section>

      {/* History — only shown if completed adventures exist */}
      {canShowHubContent && completedError && (
        <section>
          <ErrorState message="Impossible de charger votre historique..." onRetry={retryAll} />
        </section>
      )}

      {canShowHubContent && !completedError && completedAdventures.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-200/60">
              Aventures terminées
            </h2>
            {/* P2: "Tout >" will navigate to a dedicated list page */}
            <button
              onClick={() => void navigate({ to: "/hub" })}
              className="text-xs text-amber-400/70 transition-colors hover:text-amber-400"
            >
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

      {/* Non-blocking: completed adventures still loading while rest of hub is usable */}
      {canShowHubContent && completedLoading && (
        <div className="text-xs text-stone-500">Chargement de l'historique...</div>
      )}
    </div>
  );
}
