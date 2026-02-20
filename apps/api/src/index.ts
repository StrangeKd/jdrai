import express from "express";
import cors from "cors";
import helmet from "helmet";
import type { AppConfig } from "@jdrai/shared";

const app = express();

// Security & CORS — configured per environment in Story 2.x (Better Auth integration)
app.use(helmet());
app.use(cors());
const PORT = Number(process.env["API_PORT"] ?? 3000);

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
