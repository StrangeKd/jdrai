import { createFileRoute, redirect } from "@tanstack/react-router";

import { getResolvedAuthDestination } from "@/routes/routing.utils";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    if (context.auth.isLoading) return;
    throw redirect({ to: await getResolvedAuthDestination(context) });
  },
  component: () => null,
});
