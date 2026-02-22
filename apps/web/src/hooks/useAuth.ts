import { signIn, signOut, signUp, useSession } from "@/lib/auth-client";
import { router } from "@/router";

export function useAuth() {
  const { data: session, isPending, error } = useSession();

  const login = async (email: string, password: string) => {
    const result = await signIn.email({ email, password });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  };

  const register = async (email: string, password: string) => {
    const result = await signUp.email({ email, password, name: email.split("@")[0] });
    if (result.error) throw new Error(result.error.message);
    return result.data;
  };

  const logout = async () => {
    await signOut();
    router.navigate({ to: "/auth/login" });
  };

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    error,
    login,
    register,
    logout,
  };
}
