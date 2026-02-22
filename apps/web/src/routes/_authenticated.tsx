// PLACEHOLDER — Story 2.4 will implement auth guard + layout
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: () => <Outlet />,
});
