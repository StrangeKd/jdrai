/**
 * GameController — HTTP handlers for the game module (Story 6.3a Task 4 / Story 6.3b Task 3).
 * POST /api/v1/adventures/:id/action
 * GET  /api/v1/adventures/:id/state
 * GET  /api/v1/adventures/:id/messages
 * POST /api/v1/adventures/:id/save   (Story 6.5)
 *
 * The controller is purely HTTP plumbing — all DB access and ownership checks
 * live in the service / repository layers (Group C / Phase 3).
 */
import type { NextFunction, Request, Response } from "express";
import type { Server } from "socket.io";
import { z } from "zod";

import type { GameEvent } from "@jdrai/shared";

import { AppErrors } from "@/utils/errors";

import { gameService } from "./game.service";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const PlayerActionSchema = z.object({
  action: z.string().min(1).max(2000),
  choiceId: z.string().min(1).optional(),
  /** Tutorial preset selection type — "race" or "class". */
  choiceType: z.enum(["race", "class"]).optional(),
  socketId: z.string().optional(),
  /** DEV only — bypasses LLM when true. Ignored in production. */
  mockLlm: z.boolean().optional(),
  /** DEV only — routes to LLM_FREE_MODEL_KEY instead of primary provider. Ignored in production. */
  freeModels: z.boolean().optional(),
});

const MessagesQuerySchema = z.object({
  milestoneId: z.string().uuid().optional(),
});

// ---------------------------------------------------------------------------
// Event → Socket.io adapter (used by the action endpoint)
// ---------------------------------------------------------------------------

/**
 * Builds a GameEventSink that fans events out to the Socket.io room for an
 * adventure. Mirrors the wire format previously produced inline by the service:
 *  - response-start / chunk / error / response-complete → game:<type>
 *  - state-update                                       → game:state-update
 */
function makeIoEventSink(io: Server, adventureId: string): (event: GameEvent) => void {
  const room = `adventure:${adventureId}`;
  return (event) => {
    switch (event.type) {
      case "response-start":
        io.to(room).emit("game:response-start", { adventureId: event.adventureId });
        return;
      case "chunk":
        io.to(room).emit("game:chunk", {
          adventureId: event.adventureId,
          chunk: event.chunk,
        });
        return;
      case "error":
        io.to(room).emit("game:error", {
          adventureId: event.adventureId,
          error: event.message,
        });
        return;
      case "response-complete": {
        const { type: _t, ...payload } = event;
        io.to(room).emit("game:response-complete", payload);
        return;
      }
      case "state-update": {
        const { type: _t, subtype, adventureId: aid, ...rest } = event;
        io.to(room).emit("game:state-update", {
          adventureId: aid,
          type: subtype,
          ...rest,
        });
        return;
      }
    }
  };
}

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
      throw AppErrors.validationFailed(parsed.error.issues[0]?.message ?? "Invalid body");
    }

    const { action, choiceId, choiceType, mockLlm, freeModels } = parsed.data;
    const adventureId = req.params["id"]!;
    const userId = req.user!.id;

    const io = req.app.locals["io"] as Server | undefined;
    const onEvent = io ? makeIoEventSink(io, adventureId) : undefined;

    const result = await gameService.processAction({
      adventureId,
      userId,
      action,
      choiceId,
      choiceType,
      onEvent,
      stream: Boolean(io),
      mockLlm,
      freeModels,
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
    const mockLlm = req.query["mockLlm"] === "true";
    const state = await gameService.getState(adventureId, userId, mockLlm);
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

    const { savedAt } = await gameService.saveAdventure(adventureId, userId);
    res.json({ success: true, data: { savedAt } });
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
      throw AppErrors.validationFailed(
        parsed.error.issues[0]?.message ?? "Invalid query params",
      );
    }

    const result = await gameService.getMessages(adventureId, userId, parsed.data.milestoneId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
