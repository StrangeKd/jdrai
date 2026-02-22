// Stub — full implementation in Story 3.2
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/onboarding/profile-setup")({
  component: ProfileSetupPage,
});

function ProfileSetupPage() {
  return <div className="p-8 text-amber-200">Profile Setup — Story 3.2</div>;
}
