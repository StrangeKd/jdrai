import path from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createServer } from "http";
import { Server } from "socket.io";

import { app } from "./app";
import { env } from "./config/env";
import { db } from "./db";
import { registerGameSocket } from "./modules/game/game.socket";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Run pending migrations before accepting traffic
  await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });

  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: env.FRONTEND_URL, credentials: true } });

  registerGameSocket(io);
  app.locals["io"] = io;

  httpServer.listen(env.API_PORT, () => {
    console.log(`API running on http://localhost:${env.API_PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
