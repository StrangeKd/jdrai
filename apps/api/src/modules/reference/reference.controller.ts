/**
 * Reference data controllers — public endpoints for races and character classes.
 * No auth required: these are static reference data used by the tutorial PresetSelector.
 */
import type { Request, Response } from "express";

import { db } from "@/db/index";
import * as schema from "@/db/schema/index";

export async function getRaces(req: Request, res: Response): Promise<void> {
  const result = await db.select().from(schema.races).orderBy(schema.races.name);
  res.json({ success: true, data: result });
}

export async function getClasses(req: Request, res: Response): Promise<void> {
  const result = await db
    .select()
    .from(schema.characterClasses)
    .orderBy(schema.characterClasses.name);
  res.json({ success: true, data: result });
}
