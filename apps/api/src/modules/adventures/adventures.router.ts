import { type IRouter,Router } from "express";

import {
  createAdventureHandler,
  getAdventureHandler,
  listAdventuresHandler,
} from "./adventures.controller";

export const adventuresRouter: IRouter = Router();

adventuresRouter.post("/", createAdventureHandler);
adventuresRouter.get("/", listAdventuresHandler);
adventuresRouter.get("/:id", getAdventureHandler);
