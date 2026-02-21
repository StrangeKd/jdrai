import type { UserDTO } from "@jdrai/shared";

export type DbUser = {
  id: string;
  email: string;
  username: string | null;
  role: string | null;
  onboardingCompleted: boolean | null;
  createdAt: Date;
};

export function mapDbUserToDTO(row: DbUser): UserDTO {
  return {
    id: row.id,
    email: row.email,
    username: row.username ?? null,
    role: row.role === "admin" ? "admin" : "user",
    onboardingCompleted: row.onboardingCompleted ?? false,
    createdAt: row.createdAt.toISOString(),
  };
}
