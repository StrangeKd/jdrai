import { createAuthClient } from "better-auth/react";

// No baseURL — defaults to window.location.origin (localhost:5173 in dev).
// Vite proxies /api/* → localhost:3000, so cookies are set on the correct domain.
export const authClient = createAuthClient({});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

// Typed wrappers for password reset endpoints (Better Auth v1.4.18).
// These are not natively inferred in createAuthClient({}) without server type sharing.
// They call /api/auth/* directly via the Vite proxy.

type AuthResult<T = null> = { data: T; error: null } | { data: null; error: { message: string | undefined; status: number } };

/** Sends a password reset email. Resolves regardless of whether the email is registered. */
export async function forgetPassword(body: {
  email: string;
  redirectTo: string;
}): Promise<AuthResult> {
  const res = await fetch("/api/auth/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    return { data: null, error: { message: err.message, status: res.status } };
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
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    return { data: null, error: { message: err.message, status: res.status } };
  }
  return { data: null, error: null };
}
