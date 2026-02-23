import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { usernameSchema } from "@jdrai/shared";

import { NarrativeBox } from "@/components/onboarding/NarrativeBox";
import { SkipButton } from "@/components/onboarding/SkipButton";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { getErrorMessage } from "@/lib/error-messages";
import { z } from "@/lib/validation";
import { ApiError } from "@/services/api";

export const Route = createFileRoute("/_authenticated/onboarding/profile-setup")({
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

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
    watch,
  } = useForm<UsernameForm>({
    resolver: zodResolver(usernameFormSchema),
    mode: "onChange",
  });

  const currentUsername = watch("username") ?? "";

  // Clear server error and suggestion as soon as user starts editing
  const handleInputChange = () => {
    if (serverError) setServerError(null);
    if (suggestion) setSuggestion(null);
  };

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
            {confirmedUsername}, êtes-vous prêt pour votre première aventure ?
          </h1>

          <NarrativeBox>
            Un court tutoriel vous guidera dans vos premiers pas en jouant directement. Vous
            apprendrez à interagir avec le Maître du Jeu, à faire des choix, et à comprendre les
            règles de base.
            <br />
            <br />
            Durée estimée : ~5 min.
          </NarrativeBox>

          <Button
            size="lg"
            className="w-full max-w-[280px] tracking-widest uppercase"
            onClick={() => navigate({ to: "/onboarding/tutorial" })}
          >
            {"C'est parti !"}
          </Button>

          <SkipButton onClick={() => navigate({ to: "/hub" })}>Passer et aller au Hub</SkipButton>
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

        <form
          onSubmit={handleSubmit(onSubmitUsername)}
          className="w-full flex flex-col gap-4"
          noValidate
        >
          <Input
            {...register("username", { onChange: handleInputChange })}
            placeholder="Votre pseudo"
            autoFocus
            autoComplete="off"
            className="bg-stone-800 border-stone-600 text-amber-100 placeholder:text-stone-500"
            disabled={updateProfile.isPending}
          />

          {/* Client-side validation error */}
          {errors.username && (
            <p className="text-sm text-red-400" role="alert">
              {errors.username.message}
            </p>
          )}

          {/* Server-side conflict error */}
          {serverError && (
            <p className="text-sm text-amber-400" role="alert">
              {serverError}{" "}
              {suggestion && (
                <Button
                  variant="link"
                  size="sm"
                  className="underline underline-offset-4 text-amber-400 hover:text-amber-200 p-0"
                  onClick={() => {
                    setValue("username", suggestion, { shouldValidate: true });
                    setServerError(null);
                    setSuggestion(null);
                  }}
                >
                  Essayez &ldquo;{suggestion}&rdquo;
                </Button>
              )}
            </p>
          )}

          <p className="text-xs text-stone-400 leading-relaxed">
            {
              "C'est votre identité sur JDRAI. Vous pourrez choisir un autre nom pour chaque aventure."
            }
          </p>

          <Button
            type="submit"
            size="lg"
            className="w-full tracking-widest uppercase mt-2"
            disabled={!isValid || !currentUsername || !!serverError || updateProfile.isPending}
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
      </div>
    </div>
  );
}
