import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { WelcomeHero } from "@/components/onboarding/WelcomeHero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/onboarding/welcome")({
  component: WelcomePage,
});

export function WelcomePage() {
  const navigate = useNavigate();

  const handleEnter = () => {
    navigate({ to: "/onboarding/profile-setup" });
  };

  return (
    // Full-screen dark background — own layout, no AppLayout navigation (AC-5)
    <div className="min-h-screen bg-stone-950 text-amber-100 flex flex-col items-center justify-center px-6 py-12">
      {/* Inner card — centered on desktop, full-width on mobile (AC-6) */}
      <div className="w-full max-w-[480px] flex flex-col items-center gap-8 lg:max-w-[600px]">
        {/* Dark fantasy hero illustration — takes ~40% screen height on mobile (AC-2) */}
        <WelcomeHero />

        {/* Welcome text — no StepIndicator, no back button (AC-3) */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-amber-100 leading-tight">
            Votre aventure commence ici.
          </h1>
          <p className="text-base text-amber-200/70 leading-relaxed">
            Un Maître du Jeu propulsé par l&apos;IA vous attend pour des quêtes sur mesure.
          </p>
        </div>

        {/* CTA "ENTRER" → /onboarding/profile-setup (AC-4) */}
        <Button
          onClick={handleEnter}
          size="lg"
          className="w-full max-w-[280px] tracking-widest uppercase"
        >
          Entrer
        </Button>
      </div>
    </div>
  );
}
