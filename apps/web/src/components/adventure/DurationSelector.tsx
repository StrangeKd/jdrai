import type { EstimatedDuration } from "@jdrai/shared";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DURATION_OPTIONS: {
  value: EstimatedDuration;
  icon: string;
  label: string;
  estimate: string;
}[] = [
  { value: "short", icon: "⚡", label: "Courte", estimate: "~20 min" },
  { value: "medium", icon: "⚔️", label: "Moyenne", estimate: "~45 min" },
  { value: "long", icon: "📖", label: "Longue", estimate: "~1h+" },
];

interface DurationSelectorProps {
  value: EstimatedDuration;
  onChange: (v: EstimatedDuration) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {DURATION_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant="link"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:no-underline",
            value === opt.value
              ? "border-amber-600 bg-amber-900/60 text-amber-100"
              : "border-stone-700 bg-stone-800/40 text-stone-300 hover:border-stone-500",
          )}
          aria-pressed={value === opt.value}
        >
          <span aria-hidden="true">{opt.icon}</span>
          <span className="font-medium">{opt.label}</span>
          <span className="ml-auto text-sm opacity-60">{opt.estimate}</span>
        </Button>
      ))}
    </div>
  );
}
