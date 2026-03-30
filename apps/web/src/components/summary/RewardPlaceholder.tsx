/**
 * RewardPlaceholder — P1 placeholder for XP and achievements (P2 implementation).
 * NOT rendered for "abandoned" state.
 */
export function RewardPlaceholder() {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-3">Récompenses</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-muted-foreground/30">
          <span>⭐</span>
          <div>
            <p className="font-medium">Expérience</p>
            <p className="text-sm text-muted-foreground">Bientôt disponible...</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-muted-foreground/30">
          <span>🏆</span>
          <div>
            <p className="font-medium">Succès</p>
            <p className="text-sm text-muted-foreground">Les succès arrivent bientôt !</p>
          </div>
        </div>
      </div>
    </section>
  );
}
