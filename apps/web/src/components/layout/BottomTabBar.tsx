import { Link, useRouterState } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";

const tabBase = "flex flex-col h-auto flex-1 gap-1 py-2 rounded-none hover:bg-transparent";

export function BottomTabBar() {
  const { location } = useRouterState();
  const setAdventureModalOpen = useUIStore((s) => s.setAdventureModalOpen);
  const hideNav = useUIStore((s) => s.hideNav);

  if (hideNav) return null;

  const isHubActive =
    location.pathname === "/hub" || location.pathname.startsWith("/hub/");

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "flex md:hidden", // mobile only (hidden when sidebar appears at md breakpoint)
        "h-16 bg-stone-900 border-t border-stone-800",
        "items-center justify-around px-4",
      )}
    >
      <Button
        variant="ghost"
        asChild
        className={cn(
          tabBase,
          isHubActive
            ? "text-amber-400 hover:text-amber-400"
            : "text-amber-100/50 hover:text-amber-300",
        )}
      >
        <Link to="/hub">
          <span className="text-xl">🏠</span>
          <span className="text-xs">Hub</span>
        </Link>
      </Button>

      {/* Profil — P2, disabled */}
      <Button
        variant="ghost"
        disabled
        className={cn(tabBase, "text-stone-600")}
      >
        <span className="text-xl">👤</span>
        <span className="text-xs">Profil</span>
      </Button>

      {/* Aventure — always opens modal, never navigates directly */}
      <Button
        variant="ghost"
        onClick={() => setAdventureModalOpen(true)}
        className={cn(tabBase, "text-amber-100/50 hover:text-amber-300")}
      >
        <span className="text-xl">⚔️</span>
        <span className="text-xs">Aventure</span>
      </Button>
    </nav>
  );
}
