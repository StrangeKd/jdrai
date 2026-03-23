/**
 * GameController — HTTP handlers for the game module (Story 6.3a Task 4).
 * POST /api/v1/adventures/:id/action
 */
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { AppError } from "@/utils/errors";

import { gameService } from "./game.service";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const PlayerActionSchema = z.object({
  action: z.string().min(1).max(2000),
  choiceId: z.string().min(1).optional(),
  socketId: z.string().optional(),
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

    const { action, choiceId, socketId } = parsed.data;
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
