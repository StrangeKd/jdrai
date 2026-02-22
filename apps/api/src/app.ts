import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Application } from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { auth } from "./lib/auth";
import { errorHandler } from "./middleware/error.middleware";
import { authRateLimit } from "./middleware/rate-limit.middleware";
import { apiRouter } from "./routes/api.router";

export const app: Application = express();

// 1. CORS — must be first (before any handler reads headers)
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true, // Required for httpOnly session cookies
  }),
);

// 2. Helmet — security headers with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", env.API_URL],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// 3. Rate limiting on auth routes — BEFORE Better Auth handler
app.use("/api/auth/sign-in/email", authRateLimit);
app.use("/api/auth/sign-up/email", authRateLimit);

// 4. Better Auth handler — BEFORE express.json() (handles its own body parsing)
// Must be at app level: Express strips /api prefix inside sub-routers
app.all("/api/auth/*", toNodeHandler(auth));

// 5. API routes (express.json() is mounted inside apiRouter)
app.use("/api", apiRouter);

// 6. Health check (public)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// 7. Error handler — MUST be last
app.use(errorHandler);
