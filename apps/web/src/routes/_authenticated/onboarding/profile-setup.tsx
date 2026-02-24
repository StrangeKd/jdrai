import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { usernameSchema } from "@jdrai/shared";

import { NarrativeBox } from "@/components/onboarding/NarrativeBox";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { getErrorMessage } from "@/lib/error-messages";
import { z } from "@/lib/validation";
import { getResolvedAuthDestination } from "@/routes/routing.utils";
import { ApiError } from "@/services/api";

export const Route = createFileRoute("/_authenticated/onboarding/profile-setup")({
  beforeLoad: async ({ context }) => {
    if (context.auth.isLoading) return;
    // Redirect to hub if the user already has a username — prevents navigating back
    // to profile-setup via browser history after onboarding is complete.
    const destination = await getResolvedAuthDestination(context);
    if (destination === "/hub") throw redirect({ to: "/hub" });
  },
  component: ProfileSetupPage,
});

type Step = "username" | "ready";

const usernameFormSchema = z.object({ username: usernameSchema });
type UsernameForm = z.infer<typeof usernameFormSchema>;

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("username");
  const [confirmedUsername, setConfirmedUsername] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const updateProfile = useUpdateProfile();

  const form = useForm<UsernameForm>({
    resolver: zodResolver(usernameFormSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
    },
  });

  const currentUsername = form.watch("username") ?? "";

  const onSubmitUsername = async (data: UsernameForm) => {
    setServerError(null);
    try {
      await updateProfile.mutateAsync({ username: data.username });
      setConfirmedUsername(data.username);
      setStep("ready");
    } catch (error) {
      if (error instanceof ApiError && error.code === "USERNAME_TAKEN") {
        const suffix = Math.floor(Math.random() * 90) + 10;
        setServerError("⚠️ Ce pseudo est déjà pris.");
        setSuggestion(`${data.username}_${suffix}`);
      } else {
        setServerError(getErrorMessage("INTERNAL_ERROR"));
        setSuggestion(null);
      }
    }
  };

  // Step 2 — Tutorial invitation (E6-02)
  if (step === "ready") {
    return (
      <div className="min-h-screen bg-stone-950 text-amber-100 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-8">
          <StepIndicator currentStep={2} />

          <h1 className="text-2xl font-bold text-amber-100 text-center leading-tight">
            {confirmedUsername}, êtes-vous prêt(e) pour votre première aventure ?
          </h1>

          <NarrativeBox>
            Un court tutoriel vous guidera dans vos premiers pas en jouant directement. Vous
            apprendrez à interagir avec le Maître du Jeu, à faire des choix, et à comprendre les
            règles de base.
            <br />
            <br />
            {/* // TODO: evaluate the duration of the tutorial */}
            Durée estimée : ~5 min.
          </NarrativeBox>

          <Button
            size="lg"
            className="w-full max-w-[280px] tracking-widest uppercase"
            onClick={() => navigate({ to: "/onboarding/tutorial" })}
          >
            {"C'est parti !"}
          </Button>

          <Button
            variant="link"
            size="sm"
            className="text-amber-200/40 hover:text-amber-200/70 transition-colors underline-offset-4 hover:underline"
            onClick={() => navigate({ to: "/hub" })}
          >
            Passer et aller au Hub
          </Button>
        </div>
      </div>
    );
  }

  // Step 1 — Username input (E6-01)
  return (
    <div className="min-h-screen bg-stone-950 text-amber-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[480px] flex flex-col items-center gap-8">
        <StepIndicator currentStep={1} />

        <h1 className="text-2xl font-bold text-amber-100 text-center leading-tight">
          Comment vous appelle-t-on, aventurier ?
        </h1>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmitUsername)}
            className="w-full flex flex-col gap-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Votre pseudo"
                      autoFocus
                      autoComplete="off"
                      className="bg-stone-800 border-stone-600 text-amber-100 placeholder:text-stone-500"
                      disabled={updateProfile.isPending}
                      onChange={(e) => {
                        field.onChange(e);
                        // Clear server error and suggestion as soon as user starts editing
                        if (serverError) setServerError(null);
                        if (suggestion) setSuggestion(null);
                      }}
                    />
                  </FormControl>

                  {/* Client-side validation error */}
                  <FormMessage role="alert" className="text-red-400" />

                  {/* Server-side conflict error */}
                  {serverError && (
                    <div className="flex items-center gap-1" role="alert">
                      <span className="text-sm text-amber-400">{serverError}</span>
                      {suggestion && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="underline underline-offset-4 text-amber-400 hover:text-amber-200 p-0"
                          onClick={() => {
                            form.setValue("username", suggestion, { shouldValidate: true });
                            setServerError(null);
                            setSuggestion(null);
                          }}
                        >
                          Essayez &ldquo;{suggestion}&rdquo;
                        </Button>
                      )}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <p className="text-xs text-stone-400 leading-relaxed">
              {
                "C'est votre identité sur JDRAI. Vous pourrez choisir un autre nom pour chaque aventure."
              }
            </p>

            <Button
              type="submit"
              size="lg"
              className="w-full tracking-widest uppercase mt-2"
              disabled={
                !form.formState.isValid ||
                !currentUsername ||
                !!serverError ||
                updateProfile.isPending
              }
            >
              {updateProfile.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  Vérification...
                </span>
              ) : (
                "CONTINUER"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
