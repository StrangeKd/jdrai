import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { usersRouter } from "./modules/users/users.router";

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

// ⚠️ Better Auth handler MUST be before express.json() — handles its own body parsing
app.all("/api/auth/*", toNodeHandler(auth));

// JSON middleware for all other routes
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Users routes
app.use("/api/users", requireAuth, usersRouter);

// Error handler — must be last middleware
app.use(errorHandler);
