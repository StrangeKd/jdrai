/**
 * ChoiceList — renders 2-4 suggested action choices inline in the narration (Story 6.4 Task 6).
 *
 * AC: #6, #8 — appears only after streaming completes (!isStreaming && choices.length > 0).
 * Choices and FreeInput are both disabled during loading/streaming.
 */
import type { SuggestedAction } from "@jdrai/shared";

import { ChoiceButton } from "./ChoiceButton";

interface ChoiceListProps {
  choices: SuggestedAction[];
  disabled: boolean;
  onSelect: (choice: SuggestedAction) => void;
}

export function ChoiceList({ choices, disabled, onSelect }: ChoiceListProps) {
  if (choices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Actions suggérées">
      {choices.map((choice, index) => (
        <ChoiceButton
          key={choice.id}
          choice={choice}
          index={index}
          disabled={disabled}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
