import { createServer } from "http";
import { Server } from "socket.io";

import { app } from "./app";
import { env } from "./config/env";
import { registerGameSocket } from "./modules/game/game.socket";

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: env.FRONTEND_URL, credentials: true },
});

registerGameSocket(io);

// Expose io to Express handlers via app.locals
app.locals["io"] = io;

const PORT = env.API_PORT;

httpServer.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

export { io };
