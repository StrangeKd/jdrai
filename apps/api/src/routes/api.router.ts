import express, { type IRouter, Router } from "express";

import { v1Router } from "./v1.router";

export const apiRouter: IRouter = Router();

apiRouter.use(express.json());

// Add /v2 here when needed — no changes to app.ts required
apiRouter.use("/v1", v1Router);

