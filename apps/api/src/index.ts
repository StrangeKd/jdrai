import 'dotenv/config';
import app from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = app.listen(PORT, () => {
  console.log(`[API] Server running on port ${PORT}`);
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
