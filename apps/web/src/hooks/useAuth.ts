import { signIn, signOut, signUp, useSession } from "@/lib/auth-client";
import { router } from "@/router";

// Typed error that preserves the Better Auth error code and HTTP status for consumer-side mapping.
export class AuthError extends Error {
  readonly code?: string;
  readonly status?: number;
  constructor(message: string | undefined, code?: string, status?: number) {
    super(message ?? "Erreur d'authentification");
    if (code !== undefined) this.code = code;
    if (status !== undefined) this.status = status;
  }
}

// Better Auth base type extended with additionalFields from the server auth config.
// These fields are returned at runtime but not in Better Auth's default client types.
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  username?: string | null;
  role?: string;
  onboardingCompleted?: boolean;
}

export function useAuth() {
  const { data: session, isPending, error } = useSession();

  const login = async (email: string, password: string) => {
    const result = await signIn.email({ email, password });
    if (result.error)
      throw new AuthError(result.error.message, result.error.code ?? undefined, result.error.status ?? undefined);
    return result.data;
  };

  const register = async (email: string, password: string) => {
    const name = email.split("@")[0] ?? email;
    const result = await signUp.email({ email, password, name });
    if (result.error)
      throw new AuthError(result.error.message, result.error.code ?? undefined, result.error.status ?? undefined);
    return result.data;
  };

  const logout = async () => {
    await signOut();
    router.navigate({ to: "/auth/login" });
  };

  return {
    // Cast to AuthUser so callers can access additional fields (username, role, etc.)
    user: (session?.user ?? null) as AuthUser | null,
    session: session?.session ?? null,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    error,
    login,
    register,
    logout,
  };
}
