// Stub — full implementation in Story 8.2 (Epic 8)
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/onboarding/tutorial")({
  component: TutorialPage,
});

function TutorialPage() {
  return <div className="p-8 text-amber-200">Tutorial — Story 8.2</div>;
}
