import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardHeader } from "@/components/ui/card";
import { useEmailVerificationResend } from "@/hooks/useEmailVerificationResend";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { resendLabel, resendDisabled, handleResend } = useEmailVerificationResend(email, {
    callbackURL: "/hub",
  });

  if (dismissed) return null;

  return (
    <Card className="border-indigo-700/50 bg-indigo-900/60 py-0 text-sm">
      <CardHeader className="grid-cols-[1fr_auto] grid-rows-1 items-start gap-3 px-4 py-3">
        <p className="text-indigo-200">
          ✉️ Vérifiez votre email pour sécuriser votre compte.{" "}
          <Button
            variant="link"
            onClick={() => void handleResend()}
            disabled={resendDisabled}
            className="pl-2 m-0 text-indigo-300 underline transition-colors hover:text-indigo-100 disabled:no-underline disabled:opacity-50"
          >
            {resendLabel}
          </Button>
        </p>
        <CardAction className="row-auto self-start">
          <Button
            variant="link"
            onClick={() => setDismissed(true)}
            className="shrink-0 text-indigo-400 transition-colors hover:text-indigo-100 hover:no-underline"
            aria-label="Fermer"
          >
            ×
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
