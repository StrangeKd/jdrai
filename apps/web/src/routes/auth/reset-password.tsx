import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/auth-client";
import { router } from "@/router";
import { redirectIfAuthenticated } from "@/routes/routing.utils";
import { type ResetPasswordFormValues, resetPasswordSchema, resetSearchSchema } from "@/schemas/auth";

// AC-7: typed search params via TanStack Router validateSearch
export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: (search: Record<string, unknown>) => resetSearchSchema.parse(search),
  beforeLoad: redirectIfAuthenticated,
  component: ResetPasswordPage,
});

// WF-AUTH-03 — Token expired / invalid state
function TokenExpiredState() {
  return (
    <AuthCard>
      <div className="py-4 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h2 className="mb-3 font-serif text-xl font-semibold text-amber-300">Lien invalide</h2>
        <p className="mb-6 text-sm text-amber-200">Ce lien a expiré ou n&apos;est plus valide.</p>
        <Link
          to="/auth/forgot-password"
          className="block w-full rounded bg-amber-700 py-2 text-center font-semibold uppercase tracking-widest text-amber-100 hover:bg-amber-600"
        >
          Renvoyer un lien
        </Link>
        <div className="mt-4">
          <Link
            to="/auth/login"
            className="text-sm text-amber-400 underline hover:text-amber-300"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { password: "", confirmPassword: "" },
  });

  // AC-4: no token in URL → immediately show expired state
  if (!token || tokenError) {
    return <TokenExpiredState />;
  }

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setGlobalError(null);
    try {
      const result = await resetPassword({
        newPassword: data.password,
        token,
      });

      if (result.error) {
        const looksLikeInvalidToken =
          result.error.code === "INVALID_TOKEN" ||
          result.error.message?.includes("INVALID_TOKEN") === true ||
          (result.error.status === 400 && result.error.message?.toLowerCase().includes("token") === true);

        if (looksLikeInvalidToken) {
          // AC-4: token invalid, expired, or already used
          setTokenError(true);
          return;
        }

        if (result.error.status === 429) {
          setGlobalError("Trop de requêtes, veuillez patienter…");
          return;
        }

        setGlobalError("Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      // AC-3: on success, redirect to login with success indicator
      router.navigate({ to: "/auth/login", search: { reset: "success" } });
    } catch {
      setGlobalError("Une erreur réseau est survenue. Veuillez réessayer.");
    }
  };

  // WF-E4-01 — Reset form
  return (
    <AuthCard>
      <h2 className="mb-6 font-serif text-xl font-semibold text-amber-300">
        Nouveau mot de passe
      </h2>

      {globalError && (
        <div className="mb-4 rounded border border-red-500 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          ⚠️ {globalError}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
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
                      autoComplete="new-password"
                      className="border-amber-900/50 bg-amber-950/30 pr-10 text-amber-100 focus-visible:border-amber-500"
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
                <FormDescription className="text-amber-700">Min. 8 caractères</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-200">Confirmer</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      className="border-amber-900/50 bg-amber-950/30 pr-10 text-amber-100 focus-visible:border-amber-500"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-amber-500 hover:bg-transparent hover:text-amber-300"
                    aria-label="Afficher/masquer la confirmation"
                  >
                    {showConfirm ? "🙈" : "👁"}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full bg-amber-700 font-semibold uppercase tracking-widest text-amber-100 hover:bg-amber-600"
          >
            {form.formState.isSubmitting ? "Réinitialisation…" : "Réinitialiser"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
