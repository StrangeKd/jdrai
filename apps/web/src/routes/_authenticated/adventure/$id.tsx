import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/adventure/$id")({
  component: AdventureSessionPage,
});

function AdventureSessionPage() {
  return (
    <div className="p-8 text-amber-200">Game Session — Story 6.4</div>
  );
}
