import cors from "cors";
import express from "express";
import helmet from "helmet";

import type { AppConfig } from "@jdrai/shared";

import { env } from "@/config/env";

const app = express();

// Security & CORS — configured per environment in Story 2.x (Better Auth integration)
app.use(helmet());
app.use(cors());
const PORT = env.API_PORT;

// Placeholder — AppConfig will be used in later stories
const _config: AppConfig = {
  apiUrl: `http://localhost:${PORT}`,
  version: "0.0.0",
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
