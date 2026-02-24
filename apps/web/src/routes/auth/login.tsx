import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthSocialSection } from "@/components/auth/AuthSocialSection";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { router } from "@/router";
import { getNoUsernameOnboardingTarget, redirectIfAuthenticated } from "@/routes/routing.utils";
import { type LoginFormValues, loginSchema, loginSearchSchema } from "@/schemas/auth";

// AC-1: typed search params — `reset` for post-reset banner, `redirect` for auth guard
// AC-2: redirect authenticated users away from login
export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => loginSearchSchema.parse(search),
  beforeLoad: redirectIfAuthenticated,
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const { reset, redirect: redirectTo } = Route.useSearch();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError(null);
    try {
      const result = await login(data.email, data.password);
      const returnedUser = result?.user;
      const hasUsername = returnedUser && (returnedUser as { username?: string | null }).username;
      const userId = returnedUser && (returnedUser as { id?: string }).id;

      // Redirect workflow:
      // - username missing: ALWAYS enforce onboarding funnel (ignore redirect param)
      // - username present: honor validated redirect param (internal paths only), else /hub
      const destination = !hasUsername
        ? getNoUsernameOnboardingTarget(userId)
        : (redirectTo ?? "/hub");
      router.navigate({ to: destination });
    } catch {
      setGlobalError("Identifiants incorrects.");
    }
  };

  return (
    <AuthCard>
      {/* AC-5: post-reset success banner */}
      {reset === "success" && (
        <div className="mb-4 rounded border border-green-600 bg-green-950/50 px-3 py-2 text-sm text-green-300">
          ✓ Mot de passe modifié. Connectez-vous.
        </div>
      )}

      {globalError && (
        <div className="mb-4 rounded border border-red-500 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          ⚠️ {globalError}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-200">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    className="border-amber-900/50 bg-amber-950/30 text-amber-100 placeholder:text-amber-700 focus-visible:border-amber-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-200">Mot de passe</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="border-amber-900/50 bg-amber-950/30 pr-10 text-amber-100 placeholder:text-amber-700 focus-visible:border-amber-500"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-amber-500 hover:bg-transparent hover:text-amber-300"
                    aria-label="Afficher/masquer le mot de passe"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-right">
            <Link
              to="/auth/forgot-password"
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full bg-amber-700 font-semibold uppercase tracking-widest text-amber-100 hover:bg-amber-600"
          >
            {form.formState.isSubmitting ? "Connexion…" : "Connexion"}
          </Button>

          <AuthSocialSection />

          <p className="text-center text-sm text-amber-500">
            Pas de compte ?{" "}
            <Link to="/auth/register" className="text-amber-300 underline hover:text-amber-200">
              S&apos;inscrire
            </Link>
          </p>
        </form>
      </Form>
    </AuthCard>
  );
}
