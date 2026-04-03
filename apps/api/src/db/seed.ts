import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { TUTORIAL_TEMPLATE_ID } from "@/config/constants";
import { env } from "@/config/env";

import * as schema from "./schema/index";

async function seed() {
  const client = postgres(env.DATABASE_URL);
  const db = drizzle(client, { schema });

  console.log("Seeding reference data...");

  // Races
  await db
    .insert(schema.races)
    .values([
      {
        name: "Humain",
        description: "Une race polyvalente et ambitieuse.",
        traits: { adaptable: true, resilient: true },
        isDefault: true,
      },
    ])
    .onConflictDoNothing();

  // Character classes
  await db
    .insert(schema.characterClasses)
    .values([
      {
        name: "Aventurier",
        description: "Un aventurier polyvalent, prêt à affronter l'inconnu.",
        baseStats: { strength: 10, agility: 10, charisma: 10, karma: 10 },
        isDefault: true,
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
