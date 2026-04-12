import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { TUTORIAL_TEMPLATE_ID } from "@/config/constants";
import { env } from "@/config/env";

import * as schema from "./schema/index";

async function seed() {
  const client = postgres(env.DATABASE_URL);
  const db = drizzle(client, { schema });

  console.log("Seeding reference data...");

  // Races — minimum 3 for the tutorial PresetSelector (WF-E7-02)
  await db
    .insert(schema.races)
    .values([
      {
        name: "Humain",
        description: "Une race polyvalente et ambitieuse.",
        traits: { adaptable: true, resilient: true },
        isDefault: true,
      },
      {
        name: "Elfe",
        description: "Un peuple ancien, habile et en harmonie avec la nature.",
        traits: { agile: true, perceptive: true },
        isDefault: false,
      },
      {
        name: "Nain",
        description: "Un peuple robuste et tenace, forgé par les profondeurs.",
        traits: { tough: true, stubborn: true },
        isDefault: false,
      },
    ])
    .onConflictDoNothing();

  // Character classes — minimum 4 for the tutorial PresetSelector (WF-E7-03)
  await db
    .insert(schema.characterClasses)
    .values([
      {
        name: "Aventurier",
        description: "Un aventurier polyvalent, prêt à affronter l'inconnu.",
        baseStats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
        isDefault: true,
      },
      {
        name: "Guerrier",
        description: "Un combattant endurci, maître des armes et de l'armure.",
        baseStats: { strength: 14, agility: 8, charisma: 8, karma: 10 },
        isDefault: false,
      },
      {
        name: "Mage",
        description: "Un érudit des arts mystiques, manipulateur des forces magiques.",
        baseStats: { strength: 6, agility: 10, charisma: 12, karma: 12 },
        isDefault: false,
      },
      {
        name: "Voleur",
        description: "Un artiste de l'ombre, spécialiste de la discrétion et de l'astuce.",
        baseStats: { strength: 8, agility: 14, charisma: 10, karma: 8 },
        isDefault: false,
      },
    ])
    .onConflictDoNothing();

  // Adventure templates — 2 contrasted Heroic Fantasy scenarios
  await db
    .insert(schema.adventureTemplates)
    .values([
      {
        name: "La Crypte Oubliée",
        description: "Une exploration sombre d'un donjon ancien, rempli de pièges et de secrets.",
        difficulty: "normal",
        estimatedDuration: "medium",
        systemPrompt:
          "Tu es le Chroniqueur. L'aventurier explore une crypte ancienne. Ambiance sombre et tendue. [PLACEHOLDER — contenu à affiner]",
        seedData: { emoji: "🪦", genre: "dungeon_crawl", theme: "dark" },
        isPublic: true,
      },
      {
        name: "La Forêt des Murmures",
        description:
          "Une quête lumineuse à travers une forêt enchantée, peuplée de créatures mystérieuses.",
        difficulty: "easy",
        estimatedDuration: "short",
        systemPrompt:
          "Tu es le Chroniqueur. L'aventurier traverse une forêt magique. Ambiance mystérieuse et enchanteresse. [PLACEHOLDER — contenu à affiner]",
        seedData: { emoji: "🌲", genre: "exploration", theme: "enchanted" },
        isPublic: true,
      },
    ])
    .onConflictDoNothing();

  // Tutorial template — not user-selectable (isPublic: false), accessed only via tutorial flow
  await db
    .insert(schema.adventureTemplates)
    .values([
      {
        id: TUTORIAL_TEMPLATE_ID,
        name: "Le Premier Pas",
        description: "Votre première aventure guidée. Apprenez les bases en jouant.",
        genre: "heroic_fantasy",
        difficulty: "easy",
        estimatedDuration: "short",
        systemPrompt: "", // Built dynamically by PromptBuilder.buildTutorialSystemPrompt()
        seedData: {},
        isPublic: false,
        isTutorial: true,
      },
    ])
    .onConflictDoNothing();

  console.log("Seed complete.");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
