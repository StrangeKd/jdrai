import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";

import type { useAuth } from "@/hooks/useAuth";

export interface RouterContext {
  queryClient: QueryClient;
  auth: ReturnType<typeof useAuth>;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

// Typed as a component accepting no props — matches TanStackRouterDevtools signature
// while keeping the useState generic simple (avoids importing the devtools type directly).
type DevtoolsComponent = ComponentType<Record<string, never>>;

function RootLayout() {
  // Holds the lazily-loaded devtools component; null until loaded (or in production).
  const [Devtools, setDevtools] = useState<DevtoolsComponent | null>(null);

  useEffect(() => {
    // Devtools are only loaded in development — skipped entirely in production builds.
    if (!import.meta.env.DEV) return;

    // `cancelled` prevents a stale setState call if the component unmounts
    // before the dynamic import resolves (React strict-mode double-mount, fast refresh, etc.).
    let cancelled = false;
    void import("@tanstack/react-router-devtools").then((mod) => {
      if (!cancelled) setDevtools(() => mod.TanStackRouterDevtools as unknown as DevtoolsComponent);
    });

    return () => {
      cancelled = true;
    };
  }, []); // Empty deps: load once on mount, never re-run.

  return (
    <>
      <Outlet /> {/* Renders the matched child route */}
      {Devtools && <Devtools />} {/* Injected after the app tree to avoid layout impact */}
    </>
  );
}
