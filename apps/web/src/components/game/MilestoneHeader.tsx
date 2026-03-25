/**
 * MilestoneHeader — displays a milestone name and active badge.
 * Used in HistoryDrawer to group messages by milestone.
 * Shows an "● en cours" badge when isActive=true.
 */

interface MilestoneHeaderProps {
  name: string;
  isActive: boolean;
}

export function MilestoneHeader({ name, isActive }: MilestoneHeaderProps) {
  return (
    <div className="flex items-center gap-2 py-2">
      <span className="text-sm font-semibold text-amber-300 flex-1 truncate">🏴 {name}</span>
      {isActive && (
        <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">● en cours</span>
      )}
    </div>
  );
}
