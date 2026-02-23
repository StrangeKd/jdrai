import { cn } from "@/lib/utils";

interface WelcomeHeroProps {
  className?: string;
}

export function WelcomeHero({ className }: WelcomeHeroProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl overflow-hidden",
        "bg-linear-to-b from-stone-900 via-stone-800 to-amber-950",
        "w-full h-[40vh] max-h-72 md:h-64 lg:w-[600px]",
        className,
      )}
    >
      {/* Placeholder — real dark fantasy illustration asset added in design pass */}
      <div className="relative z-10 text-center">
        <p className="text-4xl font-bold text-amber-400 tracking-widest">JDRAI</p>
        <p className="text-sm text-amber-200/60 mt-1 tracking-wider">Jeu de Rôle IA</p>
      </div>
      {/* Subtle atmospheric overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-stone-950/60 to-transparent" />
    </div>
  );
}
