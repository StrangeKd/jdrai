import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

// Extend TanStack Router's HistoryState to allow passing isNew flag on navigation
declare module "@tanstack/react-router" {
  interface HistoryState {
    isNew?: boolean;
  }
}

import type { AdventureCreateInput } from "@jdrai/shared";

import { abandonAdventure, createAdventure, getAdventures, getTemplates } from "@/services/adventure.service";

export function useActiveAdventures() {
  return useQuery({
    queryKey: ["adventures", "active"],
    queryFn: () => getAdventures("active"),
    staleTime: 30_000,
  });
}

export function useCompletedAdventures() {
  return useQuery({
    queryKey: ["adventures", "completed"],
    queryFn: () => getAdventures("completed"),
    staleTime: 60_000,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
    staleTime: 5 * 60 * 1000, // Templates rarely change — cache 5 minutes
  });
}

export function useCreateAdventure() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: AdventureCreateInput) => createAdventure(input),
    onSuccess: async (adventure) => {
      await queryClient.invalidateQueries({ queryKey: ["adventures"] });
      await navigate({ to: "/adventure/$id", params: { id: adventure.id }, state: { isNew: true } });
    },
  });
}

export function useAbandonAdventure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adventureId: string) => abandonAdventure(adventureId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["adventures", "active"] });
      await queryClient.invalidateQueries({ queryKey: ["adventures"] });
    },
  });
}
