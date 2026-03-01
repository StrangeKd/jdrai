import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { UserDTO, UserUpdateInput } from "@jdrai/shared";

import { getSession } from "@/lib/auth-client";
import { api } from "@/services/api";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdateInput) =>
      api.patch<{ success: true; data: UserDTO }>("/api/v1/users/me", data).then((r) => r.data),
    onSuccess: async (updatedUser) => {
      // Populate the TanStack Query cache immediately with the mutation result.
      // Uses the same key as useCurrentUser() so Tier 2 of getResolvedAuthDestination
      // picks it up during the brief window before React re-renders with fresh auth.
      queryClient.setQueryData(["user", "me"], updatedUser);
      // Refresh Better Auth session so useSession() reflects the updated username,
      // which triggers the useEffect in main.tsx → router.invalidate().
      await getSession();
    },
  });
}
