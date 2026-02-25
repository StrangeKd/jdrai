import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  icon: string;
  label: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}

export function ActionCard({ icon, label, description, disabled, onClick }: ActionCardProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      title={
        disabled
          ? "Limite de 5 aventures atteinte — abandonnez une aventure pour en créer une nouvelle"
          : undefined
      }
      className={cn(
        "flex flex-1 min-w-0 flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors h-32 w-full",
        disabled
          ? "cursor-not-allowed border-stone-700/30 bg-stone-800/30 text-stone-600"
          : "border-stone-700 bg-stone-800 text-amber-100 hover:border-amber-700 hover:bg-stone-700",
      )}
    >
      <span className="text-2xl">{icon}</span>
      <span className="w-full text-sm font-medium whitespace-normal wrap-break-word">{label}</span>
      <span className="hidden w-full text-xs leading-snug text-amber-200/50 whitespace-normal wrap-break-word lg:block">
        {description}
      </span>
    </Button>
  );
}

export function ActionCardSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-stone-700" />
      ))}
    </div>
  );
}
