import type { ReactNode } from "react";

interface SkipButtonProps {
  onClick: () => void;
  children: ReactNode;
}

export function SkipButton({ onClick, children }: SkipButtonProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="text-sm text-amber-200/40 hover:text-amber-200/70 transition-colors underline-offset-4 hover:underline"
    >
      {children}
    </button>
  );
}
