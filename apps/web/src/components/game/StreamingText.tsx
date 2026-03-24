/**
 * StreamingText — displays text being streamed chunk by chunk (Story 6.4 Task 4).
 *
 * Shows a blinking cursor at the end while streaming is active (AC: #3).
 */

interface StreamingTextProps {
  /** Accumulated streaming text content */
  text: string;
  /** Whether streaming is active (cursor visible) */
  active: boolean;
}

export function StreamingText({ text, active }: StreamingTextProps) {
  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {text}
      {active && (
        <span
          aria-hidden="true"
          className="inline-block w-0.5 h-[1em] bg-amber-300/80 ml-0.5 align-middle animate-pulse"
        />
      )}
    </span>
  );
}
