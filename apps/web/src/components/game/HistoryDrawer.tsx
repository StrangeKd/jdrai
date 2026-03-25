/**
 * HistoryDrawer — full-screen on mobile / side panel on desktop.
 * Displays adventure message history grouped by milestone.
 * Data is fetched from GET /adventures/:id/messages only when open.
 * Story 6.6 Task 3.
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import type { GameMessageDTO, MilestoneDTO } from "@jdrai/shared";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchMessages } from "@/services/adventure.service";

import { MilestoneHeader } from "./MilestoneHeader";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Truncates text to maxLength chars, appending "..." if cut. */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Groups messages by milestone using milestoneId → milestone.id matching.
 * Milestones are ordered by sortOrder. Milestones with no messages are excluded.
 * Messages with no milestoneId (system messages, etc.) are excluded from display.
 */
function groupByMilestone(
  messages: GameMessageDTO[],
  milestones: MilestoneDTO[],
): Array<{ milestone: MilestoneDTO; messages: GameMessageDTO[] }> {
  return milestones
    .map((milestone) => ({
      milestone,
      messages: messages.filter((m) => m.milestoneId === milestone.id),
    }))
    .filter((group) => group.messages.length > 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  adventureId: string;
  milestones: MilestoneDTO[];
}

export function HistoryDrawer({ isOpen, onClose, adventureId, milestones }: HistoryDrawerProps) {
  const activeMilestoneRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["adventure", adventureId, "messages"],
    queryFn: () => fetchMessages(adventureId),
    enabled: isOpen,
    staleTime: 30_000,
  });

  // Scroll to the active milestone section when the drawer opens
  useEffect(() => {
    if (!isOpen || !activeMilestoneRef.current) return;
    const timer = setTimeout(() => {
      activeMilestoneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const groups = groupByMilestone(messages, milestones);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full md:w-96 p-0 flex flex-col"
        showCloseButton={false}
      >
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fermer l'historique"
            >
              ← Retour
            </button>
            <SheetTitle className="text-base">Historique</SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-4">
            {isLoadingMessages && (
              <div className="space-y-3" aria-busy="true" aria-label="Chargement de l'historique">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-2 bg-muted rounded w-full" />
                    <div className="h-2 bg-muted rounded w-4/5" />
                  </div>
                ))}
              </div>
            )}

            {!isLoadingMessages && groups.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun message dans cette aventure.
              </p>
            )}

            {!isLoadingMessages &&
              groups.map(({ milestone, messages: groupMessages }) => {
                const isActive = milestone.status === "active";
                return (
                  <div
                    key={milestone.id}
                    ref={isActive ? activeMilestoneRef : undefined}
                    className="relative"
                  >
                    <div className="border-b border-border pb-1 mb-3">
                      <MilestoneHeader name={milestone.name} isActive={isActive} />
                    </div>

                    <div className="space-y-3">
                      {groupMessages.map((message) => {
                        if (message.role === "system") return null;
                        return (
                          <div key={message.id}>
                            {message.role === "assistant" && (
                              <p className="text-sm text-foreground leading-relaxed">
                                {truncate(message.content, 200)}
                              </p>
                            )}
                            {message.role === "user" && (
                              <p className="text-sm text-muted-foreground italic">
                                ▸ {message.content}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
