/**
 * PresetSelector — visual card selector for race/class choices in the tutorial.
 *
 * Displayed inside NarrationPanel in place of ChoiceList when the LLM emits
 * [SHOW_PRESET_SELECTOR:race|class]. Cards are richer than ChoiceButtons —
 * they show icon + name + trait.
 *
 * Story 8.2 Task 6 (AC: #4, #5, #12)
 */

export interface PresetOption {
  id: string;
  name: string;
  icon: string;
  trait: string;
}

interface PresetSelectorProps {
  type: "race" | "class";
  options: PresetOption[];
  onSelect: (option: PresetOption) => void;
  isDisabled: boolean;
}

export function PresetSelector({ options, onSelect, isDisabled }: PresetSelectorProps) {
  return (
    // Mobile: vertical stack; desktop: 2-column grid
    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => !isDisabled && onSelect(option)}
          disabled={isDisabled}
          className={[
            "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-left transition-all",
            "border-amber-600/30 bg-stone-800/60 hover:border-amber-500 hover:bg-stone-700/60",
            "disabled:pointer-events-none disabled:opacity-40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
          ].join(" ")}
        >
          {/* Icon */}
          <span className="text-3xl" aria-hidden="true">
            {option.icon}
          </span>
          {/* Name */}
          <span className="font-bold text-amber-100">{option.name}</span>
          {/* Trait */}
          <span className="text-xs italic text-amber-200/60 text-center leading-snug">
            {option.trait}
          </span>
        </button>
      ))}
    </div>
  );
}
