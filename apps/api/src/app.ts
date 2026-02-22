import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { auth } from "./lib/auth";
import { errorHandler } from "./middleware/error.middleware";
import { apiRouter } from "./routes/api.router";

export const app: Application = express();

// Security
app.use(helmet());

// CORS — must allow credentials for httpOnly cookies
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

// Must be at app level (not sub-router): Express strips the /api prefix from req.url
// inside sub-routers, so Better Auth wouldn't match its /api/auth basePath.
// Must come before express.json() — Better Auth handles its own body parsing.
app.all("/api/auth/*", toNodeHandler(auth));

// API routes (mounted once under /api)
app.use("/api", apiRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handler — must be last middleware
app.use(errorHandler);
