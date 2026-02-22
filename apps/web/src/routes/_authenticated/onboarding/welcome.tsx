// Stub — full implementation in Story 3.1
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/onboarding/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  return <div className="p-8 text-amber-200">Welcome — Story 3.1</div>;
}
