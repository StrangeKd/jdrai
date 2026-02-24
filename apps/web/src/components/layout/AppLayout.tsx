import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AdventureModal } from "@/components/hub/AdventureModal";

import { BottomTabBar } from "./BottomTabBar";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Returns true for routes that must hide all navigation chrome:
 * - Onboarding routes: linear tunnel UX
 * - Game session routes: /adventure/:id (immersive mode, NOT /adventure/:id/summary)
 */
export function shouldHideNav(pathname: string): boolean {
  if (pathname.startsWith("/onboarding")) return true;
  // Match /adventure/:id exactly (not /adventure/new, not /adventure/:id/summary)
  // NOTE: "/adventure/new" is the adventure config screen (Story 5.2) and must keep nav visible.
  if (/^\/adventure\/[^/]+$/.test(pathname) && pathname !== "/adventure/new") return true;
  return false;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { location } = useRouterState();
  const hideNav = shouldHideNav(location.pathname);

  if (hideNav) {
    return (
      <div className="min-h-screen bg-stone-950 text-amber-100">{children}</div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-amber-100 flex">
      {/* Sidebar — hidden on mobile, collapsed on tablet, full on desktop */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* pb-16 reserves space for BottomTabBar on mobile; lg:pb-0 removes it on desktop */}
        <div className="flex-1 pb-16 md:pb-0">{children}</div>
      </main>

      {/* BottomTabBar — mobile only (hidden lg:hidden) */}
      <BottomTabBar />

      {/* Adventure modal — shared by Sidebar and BottomTabBar */}
      <AdventureModal />
    </div>
  );
}
