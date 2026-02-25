import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardHeader } from "@/components/ui/card";

export function ProfileIncompleteBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Link to="/onboarding/profile-setup" className="block">
      <Card className="border-amber-700/50 bg-amber-900/60 py-0 text-left text-sm transition-colors hover:bg-amber-900/80">
        <CardHeader className="grid-cols-[1fr_auto] grid-rows-1 items-center gap-3 px-4 py-3">
          <p className="text-amber-200">
            ⭐ Complétez votre profil pour débloquer vos récompenses !
          </p>
          <CardAction className="row-auto self-center">
            <Button
              variant="link"
              size="icon"
              aria-label="Fermer"
              className="shrink-0 text-amber-400 transition-colors hover:no-underline hover:text-amber-200"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDismissed(true);
              }}
            >
              ×
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    </Link>
  );
}
