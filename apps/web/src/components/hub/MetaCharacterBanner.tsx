import type { UserDTO } from "@jdrai/shared";

interface MetaCharacterBannerProps {
  user: UserDTO | undefined;
  isLoading: boolean;
}

export function MetaCharacterBanner({ user, isLoading }: MetaCharacterBannerProps) {
  if (isLoading) {
    return <MetaCharacterBannerSkeleton />;
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar placeholder */}
      <div
        aria-label="Avatar"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-stone-700 text-2xl"
      >
        🧙
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-semibold text-amber-100">
          {user?.username ?? user?.email ?? "Aventurier"}
        </p>
        <p className="text-xs text-amber-200/60">Apprenti aventurier</p>

        {/* XP bar — static P1 placeholder */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Niv. 1</span>
          <div className="h-1.5 flex-1 rounded-full bg-stone-700">
            <div className="h-full w-0 rounded-full bg-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetaCharacterBannerSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4">
      <div className="h-14 w-14 shrink-0 rounded-full bg-stone-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-stone-700" />
        <div className="h-3 w-24 rounded bg-stone-700" />
        <div className="h-1.5 w-full rounded-full bg-stone-700" />
      </div>
    </div>
  );
}
