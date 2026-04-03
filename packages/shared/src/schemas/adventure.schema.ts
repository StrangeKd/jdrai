import { z } from "zod";

export const characterStatsSchema = z.object({
  strength: z.number().int().min(1).max(20),
  agility: z.number().int().min(1).max(20),
  charisma: z.number().int().min(1).max(20),
  karma: z.number().int().min(1).max(20),
});

export const adventureCreateSchema = z.object({
  templateId: z.string().uuid().optional(),
  title: z.string().min(1).max(100).optional(),
  difficulty: z.enum(["easy", "normal", "hard", "nightmare"]),
  estimatedDuration: z.enum(["short", "medium", "long"]),
  tone: z.enum(["serious", "humorous", "epic", "dark"]).optional(),
  // Tutorial flow flag (Epic 8)
  isTutorial: z.boolean().optional(),
  // Optional in P1 — server auto-creates character from meta-character or defaults
  character: z
    .object({
      name: z.string().min(1).max(50),
      classId: z.string().uuid(),
      raceId: z.string().uuid(),
      background: z.string().max(500).optional(),
      stats: characterStatsSchema,
    })
    .optional(),
});

export type AdventureCreateSchema = z.infer<typeof adventureCreateSchema>;

// Schema for PATCH /api/v1/adventures/:id — valid target statuses from client
export const adventureUpdateSchema = z.object({
  status: z.enum(["completed", "abandoned"]),
});

export type AdventureUpdateSchema = z.infer<typeof adventureUpdateSchema>;
