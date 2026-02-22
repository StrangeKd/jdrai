import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
import { requestPasswordReset } from "@/lib/auth-client";
import { type ForgotPasswordFormValues, forgotPasswordSchema } from "@/schemas/auth";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    // Always show confirmation regardless of whether the email exists (anti-enumeration)
    await requestPasswordReset({
      email: data.email,
      redirectTo: `${window.location.origin}/auth/reset-password`,
    }).catch(() => {
      // Silently ignore errors — do not reveal if account exists
    });
    setSent(true);
  };

  // WF-E3-02 — Confirmation state (no navigation, same route)
  if (sent) {
    return (
      <AuthCard>
        <div className="py-4 text-center">
          <div className="mb-4 text-4xl">✉️</div>
          <h2 className="mb-3 font-serif text-xl font-semibold text-amber-300">Email envoyé !</h2>
          <p className="mb-2 text-sm text-amber-200">
            Si un compte existe avec cette adresse, vous recevrez un lien sous peu.
          </p>
          <p className="mb-6 text-sm text-amber-500">Pensez à vérifier vos spams.</p>
          <Link to="/auth/login" className="text-sm text-amber-400 underline hover:text-amber-300">
            Retour à la connexion
          </Link>
        </div>
      </AuthCard>
    );
  }

  // WF-E3-01 — Request form
  return (
    <AuthCard>
      <h2 className="mb-2 font-serif text-xl font-semibold text-amber-300">
        Mot de passe oublié
      </h2>
      <p className="mb-6 text-sm text-amber-500">
        Entrez votre email pour recevoir un lien de réinitialisation.
      </p>

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

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full bg-amber-700 font-semibold uppercase tracking-widest text-amber-100 hover:bg-amber-600"
          >
            {form.formState.isSubmitting ? "Envoi…" : "Envoyer le lien"}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center">
        <Link to="/auth/login" className="text-sm text-amber-400 underline hover:text-amber-300">
          Retour à la connexion
        </Link>
      </div>
    </AuthCard>
  );
}
