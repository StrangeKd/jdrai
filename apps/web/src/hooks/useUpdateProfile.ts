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
    onSuccess: async (updatedUser) => {
      // Populate the TanStack Query cache immediately with the mutation result.
      // Used as a synchronous fallback in getResolvedAuthDestination for the brief
      // window between mutation completion and React re-rendering App with fresh auth.
      queryClient.setQueryData(["user", "me", updatedUser.id], updatedUser);
      // Refresh Better Auth session so useSession() reflects the updated username,
      // which triggers the useEffect in main.tsx → router.invalidate().
      await getSession();
    },
  });
}
