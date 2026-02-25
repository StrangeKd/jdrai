import { useQuery } from "@tanstack/react-query";

import { getAdventures } from "@/services/adventure.service";

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
