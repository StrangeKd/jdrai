import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/adventure/$id/summary")({
  component: AdventureSummaryPage,
});

function AdventureSummaryPage() {
  return (
    <div className="p-8 text-amber-200">Adventure Summary — Story 7.2</div>
  );
}
