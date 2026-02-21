export interface RaceDTO {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

export interface CharacterClassDTO {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

export interface AdventureTemplateDTO {
  id: string;
  name: string;
  description: string;
  difficulty: "easy" | "normal" | "hard" | "nightmare";
  estimatedDuration: "short" | "medium" | "long";
  isPublic: boolean;
  // systemPrompt is NOT exposed to frontend — backend only
}
