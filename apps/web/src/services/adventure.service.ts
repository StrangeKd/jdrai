import type { AdventureDTO } from "@jdrai/shared";

import { api } from "@/services/api";

export function getAdventures(status?: "active" | "completed" | "abandoned") {
  const endpoint = status
    ? `/api/v1/adventures?status=${status}`
    : "/api/v1/adventures";
  return api
    .get<{ success: true; data: AdventureDTO[] }>(endpoint)
    .then((r) => r.data);
}
