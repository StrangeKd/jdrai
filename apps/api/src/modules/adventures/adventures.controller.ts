import type { NextFunction, Request, Response } from "express";

import { adventureCreateSchema } from "@jdrai/shared";

import {
  createAdventureForUser,
  getAdventureById,
  getAdventuresForUser,
  getTemplates,
} from "./adventures.service";

export async function createAdventureHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = adventureCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: parsed.error.flatten(),
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const adventure = await createAdventureForUser(req.user!.id, parsed.data);
    res.status(201).json({ success: true, data: adventure });
  } catch (error) {
    next(error);
  }
}

export async function listAdventuresHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const statusFilter = typeof req.query["status"] === "string" ? req.query["status"] : undefined;
    const adventures = await getAdventuresForUser(req.user!.id, statusFilter);
    res.json({ success: true, data: adventures });
  } catch (error) {
    next(error);
  }
}

export async function getAdventureHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adventure = await getAdventureById(req.params["id"]!, req.user!.id);
    res.json({ success: true, data: adventure });
  } catch (error) {
    next(error);
  }
}

export async function listTemplatesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const templates = await getTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
}
