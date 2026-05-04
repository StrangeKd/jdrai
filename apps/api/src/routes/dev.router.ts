/**
 * dev.router.ts — DEV-only routes for manual QA and test plan validation.
 * NOT mounted in production (guarded by NODE_ENV check in api.router.ts).
 *
 * Available routes:
 *   POST /api/dev/adventures/:id/trigger-signal
 *     Body: { signal: "ADVENTURE_COMPLETE" | "GAME_OVER" | "LLM_FAIL" }
 *
 * Signals:
 *   ADVENTURE_COMPLETE  → applySignals({ adventureComplete: true })  — isGameOver=false, async summary
 *   GAME_OVER           → applySignals({ isGameOver: true })          — isGameOver=true,  async summary
 *   LLM_FAIL            → completeAdventure() without LLM             — completed, narrativeSummary=null
 *
 * Use window.__devAdventureOps(adventureId) in the browser console for convenience.
 */
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { type IRouter,Router } from "express";

import { db } from "@/db";
import { adventures } from "@/db/schema";
import { requireAuth } from "@/middleware/auth.middleware";
import {
  completeAdventure,
  getAdventureByIdOrThrow,
} from "@/modules/game/game.repository";
import { gameService } from "@/modules/game/game.service";
import { AppError } from "@/utils/errors";
import { logger } from "@/utils/logger";

export const devRouter: IRouter = Router();

const VALID_SIGNALS = ["ADVENTURE_COMPLETE", "GAME_OVER", "LLM_FAIL"] as const;
type DevSignal = (typeof VALID_SIGNALS)[number];

devRouter.post(
  "/adventures/:id/trigger-signal",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adventureId = req.params["id"]!;
      const userId = req.user!.id;
      const { signal } = req.body as { signal?: string };

      if (!signal || !VALID_SIGNALS.includes(signal as DevSignal)) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          `Invalid signal. Expected one of: ${VALID_SIGNALS.join(", ")}`,
        );
      }

      // Verify ownership (404 + 403 in a single call)
      await getAdventureByIdOrThrow(adventureId, userId);

      const io = req.app.locals["io"] as import("socket.io").Server | undefined;

      if (signal === "ADVENTURE_COMPLETE") {
        await gameService.applySignals(
          { adventureComplete: true, isGameOver: false, choices: [] },
          adventureId,
          io,
        );
      } else if (signal === "GAME_OVER") {
        await gameService.applySignals(
          { adventureComplete: false, isGameOver: true, choices: [] },
          adventureId,
          io,
        );
      } else {
        // LLM_FAIL: mark adventure completed without triggering narrative summary generation.
        // Verifies that the adventure is correctly completed even when the async LLM call would fail.
        await completeAdventure(adventureId, false);
        logger.warn(
          { adventureId },
          "[DEV] LLM_FAIL: adventure completed, narrative summary skipped (narrativeSummary stays null)",
        );
      }

      // Return the updated adventure row so the caller can verify DB state
      const [updated] = await db
        .select({
          id: adventures.id,
          status: adventures.status,
          isGameOver: adventures.isGameOver,
          narrativeSummary: adventures.narrativeSummary,
          completedAt: adventures.completedAt,
        })
        .from(adventures)
        .where(eq(adventures.id, adventureId))
        .limit(1);

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },
);
