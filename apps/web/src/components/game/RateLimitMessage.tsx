/**
 * RateLimitMessage — inline message shown below ChoiceList when rate-limited (Story 6.8 Task 5).
 *
 * Displays thematic countdown: "⏳ Le MJ reprend son souffle... (0:23)"
 * Disappears when countdown reaches 0 (isRateLimited=false).
 *
 * AC: #1
 */

interface RateLimitMessageProps {
  visible: boolean;
  countdown: number;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RateLimitMessage({ visible, countdown }: RateLimitMessageProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-4 text-center text-sm text-amber-400/80 italic"
    >
      ⏳ Le MJ reprend son souffle... ({formatCountdown(countdown)})
    </div>
  );
}

// Exported for use in FreeInput placeholder formatting (avoids duplication)
export { formatCountdown };
