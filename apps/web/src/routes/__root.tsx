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

type DevtoolsComponent = ComponentType<Record<string, never>>;

function RootLayout() {
  const [Devtools, setDevtools] = useState<DevtoolsComponent | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    let cancelled = false;
    void import("@tanstack/react-router-devtools").then((mod) => {
      if (!cancelled) setDevtools(() => mod.TanStackRouterDevtools as unknown as DevtoolsComponent);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Outlet />
      {Devtools && <Devtools />}
    </>
  );
}
