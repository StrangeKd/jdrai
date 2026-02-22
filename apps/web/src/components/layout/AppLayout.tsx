import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

// P1 placeholder — full implementation in Story 4.1 (sidebar + bottom tab bar)
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-950 text-amber-100">
      {/* TODO Story 4.1: Sidebar (desktop) + BottomTabBar (mobile) */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
