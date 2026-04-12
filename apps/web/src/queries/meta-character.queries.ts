/**
 * Shared TanStack Query options for MetaCharacter endpoints.
 * Extracted to allow reuse across routes without creating import cycles.
 */
import type { MetaCharacterDTO } from "@jdrai/shared";

import { api } from "@/services/api";

export const metaCharacterQuery = {
  queryKey: ["meta-character"] as const,
  queryFn: () =>
    api
      .get<{ success: true; data: MetaCharacterDTO | null }>("/api/v1/meta-character")
      .then((r) => r.data),
};
