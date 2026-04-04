import { type IRouter, Router } from "express";

import { getClasses, getRaces } from "./reference.controller";

export const referenceRouter: IRouter = Router();

referenceRouter.get("/races", getRaces);
referenceRouter.get("/classes", getClasses);
