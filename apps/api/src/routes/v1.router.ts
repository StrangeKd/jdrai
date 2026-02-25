import { IRouter, Router } from "express";

import { requireAuth } from "@/middleware/auth.middleware";
import { adventuresStubRouter } from "@/modules/adventures/adventures.stub.router";
import { usersRouter } from "@/modules/users/users.router";
// import { adventuresRouter } from "@/modules/adventures/adventures.router";
// import { gameRouter } from "@/modules/game/game.router";

export const v1Router: IRouter = Router();

v1Router.use("/users", requireAuth, usersRouter);
// TODO(Story 5.1): replace stub with real router: v1Router.use("/adventures", requireAuth, adventuresRouter)
v1Router.use("/adventures", requireAuth, adventuresStubRouter);
// v1Router.use("/game", requireAuth, gameRouter);
