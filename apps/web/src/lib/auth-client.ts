import { createAuthClient } from "better-auth/react";

// No baseURL — defaults to window.location.origin (localhost:5173 in dev).
// Vite proxies /api/* → localhost:3000, so cookies are set on the correct domain.
export const authClient = createAuthClient({});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

// Typed wrappers for password reset endpoints (Better Auth v1.4.18).
// These are not natively inferred in createAuthClient({}) without server type sharing.
// They call /api/auth/* directly via the Vite proxy.
type AuthError = {
  message: string | undefined;
  status: number;
  code: string | undefined;
};
type AuthResult<T = null> = { data: T; error: null } | { data: null; error: AuthError };

function parseAuthError(payload: unknown, status: number): AuthError {
  const asRecord =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : undefined;
  const nestedError =
    asRecord?.error && typeof asRecord.error === "object"
      ? (asRecord.error as Record<string, unknown>)
      : undefined;

  const messageRaw = nestedError?.message ?? asRecord?.message;
  const codeRaw = nestedError?.code ?? asRecord?.code;

  return {
    status,
    message: typeof messageRaw === "string" ? messageRaw : undefined,
    code: typeof codeRaw === "string" ? codeRaw : undefined,
  };
}

/** Better Auth naming: requests a password reset email. */
export async function requestPasswordReset(body: {
  email: string;
  redirectTo?: string;
}): Promise<AuthResult> {
  const res = await fetch("/api/auth/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const errPayload = (await res.json().catch(() => ({}))) as unknown;
    return { data: null, error: parseAuthError(errPayload, res.status) };
  }
  return { data: null, error: null };
}

/** Resets the user's password using the token from the reset email. */
export async function resetPassword(body: {
  newPassword: string;
  token: string;
}): Promise<AuthResult> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const errPayload = (await res.json().catch(() => ({}))) as unknown;
    return { data: null, error: parseAuthError(errPayload, res.status) };
  }
  return { data: null, error: null };
}
