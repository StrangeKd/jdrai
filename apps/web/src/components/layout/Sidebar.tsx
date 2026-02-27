import { Link, useRouterState } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";

const NAV_ITEMS = [
  { icon: "🏠", label: "Hub", to: "/hub" as const, p2: false },
  { icon: "👤", label: "Profil", to: "/profile" as const, p2: true },
] as const;

const navItemBase = "justify-start w-full gap-3 px-3 h-auto py-2.5";

export function Sidebar() {
  const { location } = useRouterState();
  const { logout } = useAuth();
  const setAdventureModalOpen = useUIStore((s) => s.setAdventureModalOpen);
  const hideNav = useUIStore((s) => s.hideNav);

  if (hideNav) return null;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0",
        "w-16 lg:w-56", // tablet: icons only | desktop: full labels
        "bg-stone-900 border-r border-stone-800",
      )}
    >
      {/* Brand */}
      <div className="px-4 py-6 flex items-center gap-3">
        <span className="text-amber-400 font-bold text-xl">⚔️</span>
        <span className="hidden lg:block text-amber-100 font-bold tracking-wider">
          JDRAI
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + "/");

          if (item.p2) {
            return (
              <Button
                key={item.label}
                variant="ghost"
                disabled
                title="Bientôt disponible"
                className={cn(navItemBase, "text-stone-600")}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden lg:block text-sm">{item.label}</span>
              </Button>
            );
          }

          return (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className={cn(
                navItemBase,
                isActive
                  ? "bg-amber-900/40 text-amber-300 hover:bg-amber-900/40 hover:text-amber-300"
                  : "text-amber-100/70 hover:bg-stone-800 hover:text-amber-100",
              )}
            >
              <Link to={item.to}>
                <span className="text-lg">{item.icon}</span>
                <span className="hidden lg:block text-sm">{item.label}</span>
              </Link>
            </Button>
          );
        })}

        {/* Aventure — always opens modal, never navigates directly */}
        <Button
          variant="ghost"
          onClick={() => setAdventureModalOpen(true)}
          className={cn(
            navItemBase,
            "text-amber-100/70 hover:bg-stone-800 hover:text-amber-100",
          )}
        >
          <span className="text-lg">⚔️</span>
          <span className="hidden lg:block text-sm">Aventure</span>
        </Button>
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col gap-1 px-2 py-4 border-t border-stone-800">
        <Button
          variant="ghost"
          disabled
          title="Bientôt disponible"
          className={cn(navItemBase, "text-stone-600")}
        >
          <span className="text-lg">⚙️</span>
          <span className="hidden lg:block text-sm">Paramètres</span>
        </Button>

        <Button
          variant="ghost"
          onClick={() => void logout()}
          className={cn(
            navItemBase,
            "text-amber-100/70 hover:bg-stone-800 hover:text-red-400",
          )}
        >
          <span className="text-lg">🚪</span>
          <span className="hidden lg:block text-sm">Déconnexion</span>
        </Button>
      </div>
    </aside>
  );
}
