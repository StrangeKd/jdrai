import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/adventure/new")({
  component: AdventureNewPage,
});

function AdventureNewPage() {
  return <div className="p-8 text-amber-200">Adventure Config — Story 5.2</div>;
}
