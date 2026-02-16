import 'dotenv/config';
import { env } from './config/env';
import app from './app';

const server = app.listen(env.port, () => {
  console.log(`[API] Server running on port ${env.port}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('[API] Server stopped (SIGTERM)');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('[API] Server stopped (SIGINT)');
    process.exit(0);
  });
});
