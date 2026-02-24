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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthError, useAuth } from "@/hooks/useAuth";
import { getRegisterErrorMessage } from "@/lib/error-messages";
import { router } from "@/router";
import { redirectIfAuthenticated } from "@/routes/routing.utils";
import { type RegisterFormValues, registerSchema } from "@/schemas/auth";

export const Route = createFileRoute("/auth/register")({
  beforeLoad: redirectIfAuthenticated,
  component: RegisterPage,
});

function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setGlobalError(null);
    try {
      await registerUser(data.email, data.password);
      router.navigate({ to: "/onboarding/welcome" });
    } catch (error) {
      setGlobalError(getRegisterErrorMessage(error instanceof AuthError ? error.code : undefined));
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
                    className="border-amber-900/50 bg-amber-950/30 text-amber-100 focus-visible:border-amber-500"
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

          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
            {form.formState.isSubmitting ? "Inscription…" : "S'inscrire"}
          </Button>

          <AuthSocialSection />

          <p className="text-center text-sm text-amber-500">
            Déjà un compte ?{" "}
            <Link to="/auth/login" className="text-amber-300 underline hover:text-amber-200">
              Se connecter
            </Link>
          </p>
        </form>
      </Form>
    </AuthCard>
  );
}
