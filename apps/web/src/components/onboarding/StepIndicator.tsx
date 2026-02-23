import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: 1 | 2;
  totalSteps?: 2;
}

export function StepIndicator({ currentStep, totalSteps = 2 }: StepIndicatorProps) {
  return (
    <div className="flex gap-2 items-center" aria-label={`Étape ${currentStep} sur ${totalSteps}`}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-colors",
            i + 1 === currentStep ? "bg-amber-400" : "bg-stone-600",
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
