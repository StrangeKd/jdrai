/**
 * GameController — HTTP handlers for the game module (Story 6.3a Task 4 / Story 6.3b Task 3).
 * POST /api/v1/adventures/:id/action
 * GET  /api/v1/adventures/:id/state
 * GET  /api/v1/adventures/:id/messages
 * POST /api/v1/adventures/:id/save   (Story 6.5)
 */
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { db } from "@/db";
import { adventureCharacters, adventures } from "@/db/schema";
import { AppError } from "@/utils/errors";

import { gameService } from "./game.service";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const PlayerActionSchema = z.object({
  action: z.string().min(1).max(2000),
  choiceId: z.string().min(1).optional(),
  socketId: z.string().optional(),
  /** DEV only — bypasses LLM when true. Ignored in production. */
  mockLlm: z.boolean().optional(),
});

const MessagesQuerySchema = z.object({
  milestoneId: z.string().uuid().optional(),
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/adventures/:id/action
 * Validates body, calls processAction(), returns { success: true, data: { messageId } }.
 * Streaming happens via Socket.io; REST response is the final ack.
 */
export async function postActionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = PlayerActionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid body");
    }

    const { action, choiceId, socketId, mockLlm } = parsed.data;
    const adventureId = req.params["id"]!;
    const userId = req.user!.id;

    // Retrieve the io instance attached by index.ts (via app.locals or injected)
    const io = req.app.locals["io"] as import("socket.io").Server | undefined;

    const result = await gameService.processAction({
      adventureId,
      userId,
      action,
      choiceId,
      socketId,
      io,
      mockLlm,
    });

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        ...(result.response ? { response: result.response } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/adventures/:id/state
 * Returns full GameStateDTO; triggers milestone initialization if milestones are empty.
 */
export async function getStateHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adventureId = req.params["id"]!;
    const userId = req.user!.id;
    const state = await gameService.getState(adventureId, userId);
    res.json({ success: true, data: state });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/adventures/:id/save (Story 6.5 AC: #5)
 * Refreshes lastPlayedAt to confirm current DB state is persisted.
 * Returns { success: true, data: { savedAt: string } }.
 */
export async function postSaveHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adventureId = req.params["id"]!;
    const userId = req.user!.id;

    const adventure = await db.query.adventures.findFirst({
      where: eq(adventures.id, adventureId),
    });

    if (!adventure) {
      throw new AppError(404, "NOT_FOUND", "Adventure not found");
    }
    if (adventure.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "Not your adventure");
    }
    if (adventure.status !== "active") {
      throw new AppError(400, "ADVENTURE_NOT_ACTIVE", "Cannot save a non-active adventure");
    }

    const [character] = await db
      .select({ currentHp: adventureCharacters.currentHp })
      .from(adventureCharacters)
      .where(eq(adventureCharacters.adventureId, adventureId))
      .limit(1);

    const previousState = (adventure.state ?? {}) as Record<string, unknown>;
    const worldState =
      typeof previousState["worldState"] === "object" &&
      previousState["worldState"] !== null &&
      !Array.isArray(previousState["worldState"])
        ? (previousState["worldState"] as Record<string, unknown>)
        : {};

    await gameService.autoSave(adventureId, {
      lastPlayerAction:
        typeof previousState["lastPlayerAction"] === "string" ? previousState["lastPlayerAction"] : "",
      currentHp:
        character?.currentHp ??
        (typeof previousState["currentHp"] === "number" ? previousState["currentHp"] : 0),
      activeMilestoneId:
        typeof previousState["activeMilestoneId"] === "string"
          ? previousState["activeMilestoneId"]
          : null,
      worldState,
      updatedAt: new Date().toISOString(),
    });

    const savedAt = new Date();

    res.json({ success: true, data: { savedAt: savedAt.toISOString() } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/adventures/:id/messages?milestoneId=
 * Returns messages filtered by milestone (optional); limit 100, ordered createdAt ASC.
 */
export async function getMessagesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const adventureId = req.params["id"]!;
    const userId = req.user!.id;

    const parsed = MessagesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid query params");
    }

    const result = await gameService.getMessages(adventureId, userId, parsed.data.milestoneId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
