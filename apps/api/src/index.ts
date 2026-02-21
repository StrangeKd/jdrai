import { app } from "./app";
import { env } from "./config/env";

const PORT = env.API_PORT;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
