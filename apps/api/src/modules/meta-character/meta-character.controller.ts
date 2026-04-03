/**
 * MetaCharacterController — GET /api/v1/meta-character.
 * Story 8.1 Task 8.2.
 */
import type { NextFunction, Request, Response } from "express";

import { metaCharacterService } from "./meta-character.service";

/**
 * GET /api/v1/meta-character
 * Returns the authenticated user's MetaCharacter, or { data: null } if none exists yet.
 */
export async function getMetaCharacterHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const metaChar = await metaCharacterService.getByUserId(req.user!.id);
    res.json({ success: true, data: metaChar });
  } catch (err) {
    next(err);
  }
}
