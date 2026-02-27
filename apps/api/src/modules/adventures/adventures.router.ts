import { type IRouter,Router } from "express";

import {
  createAdventureHandler,
  getAdventureHandler,
  listAdventuresHandler,
  updateAdventureHandler,
} from "./adventures.controller";

export const adventuresRouter: IRouter = Router();

adventuresRouter.post("/", createAdventureHandler);
adventuresRouter.get("/", listAdventuresHandler);
adventuresRouter.get("/:id", getAdventureHandler);
adventuresRouter.patch("/:id", updateAdventureHandler);
