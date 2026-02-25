import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

const RESEND_COOLDOWN_SECONDS = 60;
const COOLDOWN_STORAGE_PREFIX = "jdrai:email-verification:cooldown:";
const COOLDOWN_AFTER_SUCCESS_DELAY_MS = 2000;

type CooldownStorageValue = {
  cooldownUntilMs: number;
  showCountdownAfterMs: number;
};

export function useEmailVerificationResend(
  email: string,
  options?: {
    callbackURL?: string;
  },
) {
  const callbackURL = options?.callbackURL ?? "/hub";

  const [cooldownUntilMs, setCooldownUntilMs] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isCooldownDelay, setIsCooldownDelay] = useState(false);
  const [countdownStartsAtMs, setCountdownStartsAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const delayTimeoutRef = useRef<number | null>(null);

  const storageKey = useMemo(() => `${COOLDOWN_STORAGE_PREFIX}${email}`, [email]);

  // Bootstrap cooldown from storage (prevents bypass via reload/new visit).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CooldownStorageValue>;
      const cooldownUntil =
        typeof parsed.cooldownUntilMs === "number" ? parsed.cooldownUntilMs : NaN;
      const showCountdownAfter =
        typeof parsed.showCountdownAfterMs === "number" ? parsed.showCountdownAfterMs : NaN;

      const now = Date.now();
      if (Number.isFinite(cooldownUntil) && cooldownUntil > now) {
        setCooldownUntilMs(cooldownUntil);
        if (Number.isFinite(showCountdownAfter)) {
          setCountdownStartsAtMs(showCountdownAfter);
          setIsCooldownDelay(showCountdownAfter > now);
        } else {
          setCountdownStartsAtMs(null);
          setIsCooldownDelay(false);
        }
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // Non-critical: storage may be unavailable (private mode, disabled, etc.)
    }
  }, [storageKey]);

  // Keep cooldown state in sync across tabs/windows.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.storageArea !== localStorage) return;
      if (e.key !== storageKey) return;
      try {
        if (!e.newValue) {
          setCooldownUntilMs(null);
          setIsCooldownDelay(false);
          setCountdownStartsAtMs(null);
          return;
        }
        const parsed = JSON.parse(e.newValue) as Partial<CooldownStorageValue>;
        const cooldownUntil =
          typeof parsed.cooldownUntilMs === "number" ? parsed.cooldownUntilMs : NaN;
        const showCountdownAfter =
          typeof parsed.showCountdownAfterMs === "number" ? parsed.showCountdownAfterMs : NaN;
        const now = Date.now();
        if (Number.isFinite(cooldownUntil) && cooldownUntil > now) {
          setCooldownUntilMs(cooldownUntil);
          if (Number.isFinite(showCountdownAfter)) {
            setCountdownStartsAtMs(showCountdownAfter);
            setIsCooldownDelay(showCountdownAfter > now);
          } else {
            setCountdownStartsAtMs(null);
            setIsCooldownDelay(false);
          }
        } else {
          setCooldownUntilMs(null);
          setIsCooldownDelay(false);
          setCountdownStartsAtMs(null);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [storageKey]);

  useEffect(() => {
    if (!cooldownUntilMs && !isCooldownDelay) return;
    const tick = window.setInterval(() => {
      const now = Date.now();
      setNowMs(now);

      if (isCooldownDelay && countdownStartsAtMs && countdownStartsAtMs <= now) {
        setIsCooldownDelay(false);
      }

      if (cooldownUntilMs && cooldownUntilMs <= now) {
        setCooldownUntilMs(null);
        setIsCooldownDelay(false);
        setCountdownStartsAtMs(null);
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // ignore
        }
      }
    }, 250);
    return () => window.clearInterval(tick);
  }, [cooldownUntilMs, isCooldownDelay, countdownStartsAtMs, storageKey]);

  useEffect(() => {
    return () => {
      if (delayTimeoutRef.current !== null) {
        window.clearTimeout(delayTimeoutRef.current);
      }
    };
  }, []);

  // Countdown should start at exactly 60s when the 2s delay ends.
  const countdownNowMs = countdownStartsAtMs ? Math.max(nowMs, countdownStartsAtMs) : nowMs;
  const cooldownSecondsLeft = cooldownUntilMs
    ? Math.max(0, Math.ceil((cooldownUntilMs - countdownNowMs) / 1000))
    : 0;
  const isCooldownActive = cooldownSecondsLeft > 0 && !isCooldownDelay;

  const handleResend = async () => {
    if (isCooldownActive || isSending || isCooldownDelay) return;
    setIsSending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL,
      });
      if (error) throw error;
      toast.success("Email envoyé !", { duration: 3000 });

      // Robust cooldown: persist end timestamp in localStorage (survives reloads/new visits).
      // UX requirement: keep the label as "Renvoyer" for 2 seconds, then switch to the countdown label.
      const now = Date.now();
      const showCountdownAfterMs = now + COOLDOWN_AFTER_SUCCESS_DELAY_MS;
      const cooldownUntil = showCountdownAfterMs + RESEND_COOLDOWN_SECONDS * 1000;

      setIsCooldownDelay(true);
      setCountdownStartsAtMs(showCountdownAfterMs);
      setCooldownUntilMs(cooldownUntil);
      try {
        const payload: CooldownStorageValue = {
          cooldownUntilMs: cooldownUntil,
          showCountdownAfterMs,
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        // ignore
      }

      if (delayTimeoutRef.current !== null) {
        window.clearTimeout(delayTimeoutRef.current);
      }
      delayTimeoutRef.current = window.setTimeout(() => {
        setIsCooldownDelay(false);
      }, COOLDOWN_AFTER_SUCCESS_DELAY_MS);
    } catch {
      toast.error("Échec de l'envoi. Réessayez.", { duration: 3000 });
    }
    setIsSending(false);
  };

  const resendLabel = isCooldownDelay
    ? "Renvoyer"
    : isCooldownActive
      ? `Renvoyer (${cooldownSecondsLeft}s)`
      : "Renvoyer";

  return {
    resendLabel,
    resendDisabled: !!cooldownUntilMs || isSending || isCooldownDelay,
    handleResend,
  };
}

