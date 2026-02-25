import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardHeader } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

interface EmailVerificationBannerProps {
  email: string;
}

const RESEND_COOLDOWN_SECONDS = 60;

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [cooldown, setCooldown] = useState(0); // 0 = can send
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (dismissed) return null;

  const handleResend = async () => {
    if (cooldown > 0 || status === "sending") return;
    setStatus("sending");
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/hub",
      });
      if (error) throw error;
      setStatus("sent");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const resendLabel =
    status === "sent"
      ? "Email envoyé !"
      : status === "error"
        ? "Échec, réessayez."
        : cooldown > 0
          ? `Renvoyer (${cooldown}s)`
          : "Renvoyer";

  return (
    <Card className="border-indigo-700/50 bg-indigo-900/60 py-0 text-sm">
      <CardHeader className="grid-cols-[1fr_auto] grid-rows-1 items-start gap-3 px-4 py-3">
        <p className="text-indigo-200">
          ✉️ Vérifiez votre email pour sécuriser votre compte.{" "}
          <Button
            variant="link"
            onClick={() => void handleResend()}
            disabled={cooldown > 0 || status === "sending"}
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
