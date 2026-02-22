// Stub — full implementation in P2
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  return <div className="p-8 text-amber-200">Settings — P2</div>;
}
