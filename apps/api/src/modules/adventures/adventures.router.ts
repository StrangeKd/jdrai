import { type IRouter,Router } from "express";

import {
  createAdventureHandler,
  getAdventureHandler,
  getAdventureMilestonesHandler,
  listAdventuresHandler,
  updateAdventureHandler,
} from "./adventures.controller";

export const adventuresRouter: IRouter = Router();

adventuresRouter.post("/", createAdventureHandler);
adventuresRouter.get("/", listAdventuresHandler);
// Specific sub-resource routes must be registered BEFORE the generic /:id route
adventuresRouter.get("/:id/milestones", getAdventureMilestonesHandler);
adventuresRouter.get("/:id", getAdventureHandler);
adventuresRouter.patch("/:id", updateAdventureHandler);
