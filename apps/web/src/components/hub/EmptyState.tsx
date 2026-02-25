import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  onLaunch: () => void;
  onTemplate: () => void;
}

export function EmptyState({ onLaunch, onTemplate }: EmptyStateProps) {
  return (
    <Card className="border-stone-700/50 bg-stone-800/40 py-8 shadow-none">
      <CardContent className="px-4 text-center">
        {/* P3: CompanionMessage will replace this text area */}
        <div className="space-y-2">
          <p className="text-4xl">✒️</p>
          <p className="text-lg font-semibold text-amber-100">C&apos;est trop calme ici...</p>
          <p className="text-sm text-amber-200/60">Et si on partait à l&apos;aventure ?</p>
        </div>

        <div className="mt-6 space-y-3">
          <Button onClick={onLaunch} className="w-full h-auto min-h-10 uppercase tracking-wider">
            Lancer ma première aventure
          </Button>
          <Button
            onClick={onTemplate}
            variant="link"
            className="mx-auto block text-sm text-amber-400/60 transition-colors hover:text-amber-400"
          >
            ou choisir un scénario
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
