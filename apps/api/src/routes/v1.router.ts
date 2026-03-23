import { IRouter, Router } from "express";

import { requireAuth } from "@/middleware/auth.middleware";
import { listTemplatesHandler } from "@/modules/adventures/adventures.controller";
import { adventuresRouter } from "@/modules/adventures/adventures.router";
import { postActionHandler } from "@/modules/game/game.controller";
import { usersRouter } from "@/modules/users/users.router";

export const v1Router: IRouter = Router();

v1Router.use("/users", requireAuth, usersRouter);
v1Router.use("/adventures", requireAuth, adventuresRouter);
v1Router.get("/templates", listTemplatesHandler); // public — no auth required

// Game routes — mounted under /adventures/:id to extend the adventures resource
v1Router.post("/adventures/:id/action", requireAuth, postActionHandler);
