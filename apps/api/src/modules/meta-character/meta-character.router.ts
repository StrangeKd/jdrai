import { type IRouter, Router } from "express";

import { getMetaCharacterHandler } from "./meta-character.controller";

export const metaCharacterRouter: IRouter = Router();

metaCharacterRouter.get("/", getMetaCharacterHandler);
