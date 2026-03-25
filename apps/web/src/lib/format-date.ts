/**
 * Shared date formatting utilities for game session UI.
 */

/** Formats a timestamp as a human-readable relative time in French. */
export function formatLastSaved(lastSavedAt: Date | null): string {
  if (!lastSavedAt) return "jamais";
  const diffMs = Date.now() - lastSavedAt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin === 1) return "il y a 1 min";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  return `il y a ${diffH}h`;
}
