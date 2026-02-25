/**
 * TEMPORARY STUB — Story 4.2
 * Returns empty adventures list so the Hub can be tested end-to-end.
 * Replace this file with the real adventures router when Story 5.1 ships.
 */
import { IRouter, Router } from "express";

export const adventuresStubRouter: IRouter = Router();

adventuresStubRouter.get("/", (_req, res) => {
  res.json({ success: true, data: [] });
});
