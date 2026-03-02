import { useQuery } from "@tanstack/react-query";

import type { UserDTO } from "@jdrai/shared";

import { api } from "@/services/api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: () =>
      api
        .get<{ success: true; data: UserDTO }>("/api/v1/users/me")
        .then((r) => r.data),
    staleTime: 300_000, // 5 min — user data rarely changes
    gcTime: 60 * 60 * 1000, // 1h — keep in cache without subscribers (e.g. during game session)
  });
}
