import { IRouter, Router } from "express";

import { requireAuth } from "@/middleware/auth.middleware";
import { listTemplatesHandler } from "@/modules/adventures/adventures.controller";
import { adventuresRouter } from "@/modules/adventures/adventures.router";
import { usersRouter } from "@/modules/users/users.router";
// import { gameRouter } from "@/modules/game/game.router";

export const v1Router: IRouter = Router();

v1Router.use("/users", requireAuth, usersRouter);
v1Router.use("/adventures", requireAuth, adventuresRouter);
v1Router.get("/templates", listTemplatesHandler); // public — no auth required
// v1Router.use("/game", requireAuth, gameRouter);
