import type { AdventureDTO, AdventureTemplateDTO } from "@jdrai/shared";

import { api } from "@/services/api";

export async function getAdventures(status?: "active" | "completed" | "abandoned") {
  const endpoint = status ? `/api/v1/adventures?status=${status}` : "/api/v1/adventures";
  const response = await api.get<{ success: true; data: AdventureDTO[] }>(endpoint);
  return response.data;
}

export async function getTemplates() {
  const response = await api.get<{ success: true; data: AdventureTemplateDTO[] }>("/api/v1/templates");
  return response.data;
}

export async function abandonAdventure(adventureId: string) {
  const response = await api.patch<{ success: true; data: AdventureDTO }>(
    `/api/v1/adventures/${adventureId}`,
    { status: "abandoned" },
  );
  return response.data;
}
