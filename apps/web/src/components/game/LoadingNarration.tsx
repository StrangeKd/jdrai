/**
 * LoadingNarration — themed loading animation while the GM prepares a response (Story 6.4 Task 5).
 *
 * Displayed in NarrationPanel during isLoading phase (after action submission, before streaming).
 * AC: #5 — "Le MJ consulte ses parchemins…" with animated ellipsis.
 */

export function LoadingNarration() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <span className="text-4xl" role="img" aria-label="Parchemin">
        ✒️
      </span>
      <p className="text-amber-300/70 italic text-sm">
        Le MJ consulte ses parchemins
        <span className="inline-flex gap-0.5 ml-0.5">
          <span className="animate-bounce [animation-delay:0ms]">.</span>
          <span className="animate-bounce [animation-delay:150ms]">.</span>
          <span className="animate-bounce [animation-delay:300ms]">.</span>
        </span>
      </p>
    </div>
  );
}
