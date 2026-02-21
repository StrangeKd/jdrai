import { type IRouter,Router } from "express";

import { getMe, updateMe } from "./users.controller";

export const usersRouter: IRouter = Router();

usersRouter.get("/me", getMe);
usersRouter.patch("/me", updateMe);
