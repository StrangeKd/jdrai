import { z } from "zod";

export const RaceDTOSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
  isDefault: z.boolean(),
});

export const CharacterClassDTOSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
  isDefault: z.boolean(),
});

export const AdventureTemplateDTOSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string(),
  difficulty: z.enum(["easy", "normal", "hard", "nightmare"]),
  estimatedDuration: z.enum(["short", "medium", "long"]),
  isPublic: z.boolean(),
});
