export function sanitizeRedirectPath(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (!value) return undefined;

  // Only allow internal absolute paths.
  // Disallow protocol-relative ("//evil.com") and absolute URLs ("https://...").
  if (!value.startsWith("/")) return undefined;
  if (value.startsWith("//")) return undefined;
  if (value.includes("://")) return undefined;

  // Avoid redirecting into API endpoints.
  if (value.startsWith("/api")) return undefined;

  // Avoid redirect loops back into auth pages.
  if (value.startsWith("/auth")) return undefined;

  return value;
}
