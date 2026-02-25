import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns a French relative-time string for a given ISO date string. */
export function formatRelativeTime(dateString: string): string {
  const dateMs = new Date(dateString).getTime();
  const nowMs = Date.now();

  const diffPastMs = nowMs - dateMs;
  if (diffPastMs >= 0) {
    const minutes = Math.floor(diffPastMs / 60_000);
    const hours = Math.floor(diffPastMs / 3_600_000);
    const days = Math.floor(diffPastMs / 86_400_000);
    const weeks = Math.floor(diffPastMs / 604_800_000);

    if (minutes < 1) return "à l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 24) return `il y a ${hours}h`;
    if (days < 7) return `il y a ${days} j.`;
    return `il y a ${weeks} sem.`;
  }

  const diffFutureMs = dateMs - nowMs;
  const minutes = Math.ceil(diffFutureMs / 60_000);
  const hours = Math.ceil(diffFutureMs / 3_600_000);
  const days = Math.ceil(diffFutureMs / 86_400_000);
  const weeks = Math.ceil(diffFutureMs / 604_800_000);

  if (minutes <= 1) return "dans un instant";
  if (minutes < 60) return `dans ${minutes} min`;
  if (hours < 24) return `dans ${hours}h`;
  if (days < 7) return `dans ${days} j.`;
  return `dans ${weeks} sem.`;
}
