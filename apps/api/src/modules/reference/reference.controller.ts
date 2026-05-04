/**
 * Reference data controllers — public endpoints for races and character classes.
 * No auth required: these are static reference data used by the tutorial PresetSelector.
 */
import type { Request, Response } from "express";

import { getClasses as getClassesFromService, getRaces as getRacesFromService } from "./reference.service";

export async function getRaces(req: Request, res: Response): Promise<void> {
  const data = await getRacesFromService();
  res.json({ success: true, data });
}

export async function getClasses(req: Request, res: Response): Promise<void> {
  const data = await getClassesFromService();
  res.json({ success: true, data });
}
