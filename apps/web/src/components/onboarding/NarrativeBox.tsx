import type { ReactNode } from "react";

interface NarrativeBoxProps {
  children: ReactNode;
}

export function NarrativeBox({ children }: NarrativeBoxProps) {
  return (
    <div className="bg-stone-800/60 border border-amber-900/30 rounded-lg p-4 text-amber-200/80 text-sm leading-relaxed w-full">
      <span className="mr-2 text-amber-400" aria-hidden="true">
        ✒️
      </span>
      {children}
    </div>
  );
}
