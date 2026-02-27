import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { abandonAdventure, getAdventures, getTemplates } from "@/services/adventure.service";

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
