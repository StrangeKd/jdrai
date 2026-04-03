import type { NextFunction, Request, Response } from "express";

import { adventureCreateSchema, adventureUpdateSchema } from "@jdrai/shared";

import {
  createAdventureForUser,
  getAdventureById,
  getAdventureMilestonesForUser,
  getAdventuresForUser,
  getTemplates,
  updateAdventureForUser,
} from "./adventures.service";

export async function createAdventureHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = adventureCreateSchema.parse(req.body);
    const adventure = await createAdventureForUser(req.user!.id, input);
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

export async function updateAdventureHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = adventureUpdateSchema.parse(req.body);
    const result = await updateAdventureForUser(req.user!.id, req.params["id"]!, input.status);
    // Tutorial abandonment returns null — hard deleted, no content to return
    if (result === null) {
      res.status(204).send();
      return;
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAdventureMilestonesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const milestones = await getAdventureMilestonesForUser(req.user!.id, req.params["id"]!);
    res.json({ success: true, data: milestones });
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
