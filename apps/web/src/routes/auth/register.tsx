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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { router } from "@/router";

const registerSchema = z
  .object({
    email: z.string().email("Adresse email invalide"),
    password: z.string().min(8, "Min. 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormValues) => {
    setGlobalError(null);
    try {
      await registerUser(data.email, data.password);
      router.navigate({ to: "/onboarding/welcome" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'inscription.";
      const isConflict =
        message.toLowerCase().includes("already") || message.toLowerCase().includes("exist");
      setGlobalError(
        isConflict ? "Un compte existe déjà avec cet email." : "Erreur lors de l'inscription.",
      );
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

          {/* OAuth separator — P2+ placeholder */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-amber-900/50" />
            <span className="text-xs text-amber-700">ou</span>
            <div className="flex-1 border-t border-amber-900/50" />
          </div>

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
