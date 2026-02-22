import { createAuthClient } from "better-auth/react";

// No baseURL — defaults to window.location.origin (localhost:5173 in dev).
// Vite proxies /api/* → localhost:3000, so cookies are set on the correct domain.
export const authClient = createAuthClient({});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
