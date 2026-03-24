/**
 * FreeInput — fixed bottom bar for free-text player input (Story 6.4 Task 7).
 *
 * Structure: [📜 history btn] [text input] [➤ send btn]
 * AC: #7, #8 — disabled during loading/streaming; placeholder adapts to state.
 * Enter key submits (if not disabled and input not empty).
 */
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FreeInputProps {
  disabled: boolean;
  isStreaming: boolean;
  isLoading: boolean;
  onSubmit: (text: string) => void;
  onHistoryClick: () => void;
  placeholder?: string;
}

function resolvePlaceholder(isLoading: boolean, isStreaming: boolean, custom?: string): string {
  if (isLoading) return "Patientez...";
  if (isStreaming) return "Le MJ raconte...";
  return custom ?? "Écrire votre action...";
}

export function FreeInput({
  disabled,
  isStreaming,
  isLoading,
  onSubmit,
  onHistoryClick,
  placeholder,
}: FreeInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedPlaceholder = resolvePlaceholder(isLoading, isStreaming, placeholder);

  const handleSubmit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    onSubmit(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-3 border-t border-stone-700 bg-stone-900">
      {/* History button — opens HistoryDrawer (Story 6.6) */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        onClick={onHistoryClick}
        aria-label="Historique"
        title="Historique"
      >
        📜
      </Button>

      {/* Text input */}
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={resolvedPlaceholder}
        aria-label="Votre action"
        className="flex-1 bg-stone-800 border-stone-700 text-amber-100 placeholder:text-stone-500 focus-visible:border-amber-600"
      />

      {/* Send button */}
      <Button
        type="button"
        variant="default"
        size="icon-sm"
        disabled={disabled || value.trim().length === 0}
        onClick={handleSubmit}
        aria-label="Envoyer"
        title="Envoyer"
      >
        ➤
      </Button>
    </div>
  );
}
