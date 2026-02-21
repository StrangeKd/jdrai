import { IRouter, Router } from "express";

import { requireAuth } from "@/middleware/auth.middleware";
import { usersRouter } from "@/modules/users/users.router";
// import { adventuresRouter } from "@/modules/adventures/adventures.router";
// import { gameRouter } from "@/modules/game/game.router";

export const v1Router: IRouter = Router();

v1Router.use("/users", requireAuth, usersRouter);
// v1Router.use("/adventures", requireAuth, adventuresRouter);
// v1Router.use("/game", requireAuth, gameRouter);
