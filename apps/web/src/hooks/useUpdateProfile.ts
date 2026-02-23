import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { UserDTO, UserUpdateInput } from "@jdrai/shared";

import { getSession } from "@/lib/auth-client";
import { api } from "@/services/api";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdateInput) =>
      api
        .patch<{ success: true; data: UserDTO }>("/api/v1/users/me", data)
        .then((r) => r.data),
    onSuccess: async () => {
      // Force Better Auth to re-fetch the session so useSession() reflects
      // the updated username before the next route navigation.
      await getSession();
      // Invalidate any TanStack Query cache keyed on the user profile.
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
}
