import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthCard } from "@/components/auth/AuthCard";
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

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError(null);
    try {
      const result = await login(data.email, data.password);
      const returnedUser = result?.user;
      const hasUsername =
        returnedUser && (returnedUser as { username?: string | null }).username;
      router.navigate({ to: hasUsername ? "/hub" : "/onboarding/profile-setup" });
    } catch {
      setGlobalError("Identifiants incorrects.");
    }
  };

  return (
    <AuthCard>
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

          {/* OAuth separator — P2+ placeholder */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-amber-900/50" />
            <span className="text-xs text-amber-700">ou</span>
            <div className="flex-1 border-t border-amber-900/50" />
          </div>

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
