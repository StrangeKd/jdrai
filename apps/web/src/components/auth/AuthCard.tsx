import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

interface AuthCardProps {
  children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4"
      style={{
        backgroundImage: "url('/backgrounds/auth-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* AuthCard — parchemin style */}
      <Card className="relative z-10 w-full max-w-sm gap-0 border-mauve-900/60 bg-mauve-950/90 px-8 py-10 shadow-2xl backdrop-blur-sm">
        {/* JDRAI Logo */}
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold tracking-widest text-amber-400">JDRAI</h1>
          <div className="mx-auto mt-1 h-px w-16 bg-amber-700/50" />
        </div>

        {children}
      </Card>
    </div>
  );
}
