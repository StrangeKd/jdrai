import 'dotenv/config';
import { db } from '../index';
import { users, metaCharacters, adventures, adventureMessages } from '../schema';
import { eq } from 'drizzle-orm';

const DEV_EMAIL = 'dev@jdrai.local';

async function seed() {
  console.log('[seed] Starting...');

  // Upsert user
  const existing = await db.select().from(users).where(eq(users.email, DEV_EMAIL)).limit(1);

  let userId: string;

  if (existing.length > 0) {
    userId = existing[0].id;
    console.log('[seed] User already exists:', userId);
  } else {
    const [user] = await db
      .insert(users)
      .values({ email: DEV_EMAIL, name: 'DevPlayer', emailVerified: true })
      .returning();
    userId = user.id;
    console.log('[seed] Created user:', userId);
  }

  // Upsert meta character
  const existingChar = await db
    .select()
    .from(metaCharacters)
    .where(eq(metaCharacters.userId, userId))
    .limit(1);

  let characterId: string;

  if (existingChar.length > 0) {
    characterId = existingChar[0].id;
    console.log('[seed] MetaCharacter already exists:', characterId);
  } else {
    const [character] = await db
      .insert(metaCharacters)
      .values({ userId, name: 'DevPlayer', level: 1, xp: 0 })
      .returning();
    characterId = character.id;
    console.log('[seed] Created metaCharacter:', characterId);
  }

  // Upsert adventure
  const existingAdv = await db
    .select()
    .from(adventures)
    .where(eq(adventures.userId, userId))
    .limit(1);

  let adventureId: string;

  if (existingAdv.length > 0) {
    adventureId = existingAdv[0].id;
    console.log('[seed] Adventure already exists:', adventureId);
  } else {
    const [adventure] = await db
      .insert(adventures)
      .values({
        userId,
        status: 'active',
        theme: 'La Forêt des Ombres',
        difficulty: 'normal',
        duration: 'court',
        currentMilestone: 0,
      })
      .returning();
    adventureId = adventure.id;
    console.log('[seed] Created adventure:', adventureId);

    await db.insert(adventureMessages).values([
      {
        adventureId,
        role: 'assistant',
        content:
          'Bienvenue, aventurier. La Forêt des Ombres vous attend. Que voulez-vous faire en premier ?',
      },
      {
        adventureId,
        role: 'user',
        content: "J'avance prudemment vers l'entrée de la forêt.",
      },
    ]);
    console.log('[seed] Created 2 adventure messages');
  }

  console.log('[seed] Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
