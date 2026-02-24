import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";

import { Button } from "@/components/ui/button";

export function AuthSocialSection() {
  return (
    <>
      {/* OAuth separator — P2+ placeholder */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-amber-900/50" />
        <span className="text-xs text-amber-700">ou</span>
        <div className="flex-1 border-t border-amber-900/50" />
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled
            className="border-amber-900/50 bg-amber-950/20 text-amber-300 opacity-70"
          >
            <SiGoogle aria-hidden="true" className="size-4" />
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled
            className="border-amber-900/50 bg-amber-950/20 text-amber-300 opacity-70"
          >
            <SiGithub aria-hidden="true" className="size-4" />
            GitHub
          </Button>
        </div>
        <p className="text-center text-xs text-amber-700">Bientôt disponible</p>
      </div>
    </>
  );
}
