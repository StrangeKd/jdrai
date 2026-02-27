export type MilestoneStatus = "pending" | "active" | "completed";

export interface MilestoneDTO {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  status: MilestoneStatus;
  startedAt?: string;
  completedAt?: string;
}
