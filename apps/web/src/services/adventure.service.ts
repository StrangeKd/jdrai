import type { AdventureDTO } from "@jdrai/shared";

import { api } from "@/services/api";

export async function getAdventures(status?: "active" | "completed" | "abandoned") {
  const endpoint = status ? `/api/v1/adventures?status=${status}` : "/api/v1/adventures";
  const response = await api.get<{ success: true; data: AdventureDTO[] }>(endpoint);
  return response.data;
}
