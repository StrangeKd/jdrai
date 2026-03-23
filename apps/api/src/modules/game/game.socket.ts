/**
 * game.socket.ts — Socket.io handlers for the game module.
 * Auth middleware verifies the Better Auth session cookie on connection.
 */
import { and, eq } from "drizzle-orm";
import type { Server } from "socket.io";

import { db } from "@/db";
import { adventures } from "@/db/schema";
import { auth } from "@/lib/auth";
import { logger } from "@/utils/logger";

import { gameService } from "./game.service";

export function registerGameSocket(io: Server): void {
  // Auth middleware — verify Better Auth session cookie on every connection
  io.use(async (socket, next) => {
    try {
      const session = await auth.api.getSession({
        headers: { cookie: socket.handshake.headers.cookie ?? "" },
      });
      if (!session?.user) {
        return next(new Error("UNAUTHORIZED"));
      }
      socket.data.userId = session.user.id;
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`[Socket] Connected: ${socket.id} (user: ${socket.data.userId})`);

    // Join the Socket.io room for a given adventure
    socket.on("game:join", async ({ adventureId }: { adventureId: string }) => {
      try {
        const userId = socket.data.userId as string | undefined;
        if (!userId) {
          logger.warn(`[Socket] Missing userId for ${socket.id} join attempt`);
          return;
        }

        const [row] = await db
          .select({ id: adventures.id })
          .from(adventures)
          .where(and(eq(adventures.id, adventureId), eq(adventures.userId, userId)))
          .limit(1);

        if (!row) {
          logger.warn(`[Socket] Forbidden join: ${socket.id} → adventure:${adventureId}`);
          return;
        }

        socket.join(`adventure:${adventureId}`);
        logger.info(`[Socket] ${socket.id} joined adventure:${adventureId}`);
      } catch (err) {
        logger.error("[Socket] game:join error:", err);
      }
    });

    // Story 6.8 placeholder — resync after reconnection
    socket.on("game:resync", async ({ adventureId }: { adventureId: string }) => {
      try {
        const state = await gameService.getState(adventureId, socket.data.userId as string);
        socket.emit("game:state-snapshot", state);
      } catch (err) {
        logger.error("[Socket] game:resync error:", err);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}
