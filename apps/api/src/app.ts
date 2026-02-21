import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";

import { env } from "./config/env";
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

// API routes (mounted once under /api)
app.use("/api", apiRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handler — must be last middleware
app.use(errorHandler);
