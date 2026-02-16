import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { env } from '../config/env';

const CUSTOM_MIGRATIONS = [
  '0002_updated_at_triggers.sql',
];

async function runCustomMigrations() {
  const pool = new Pool({ connectionString: env.databaseUrl });

  try {
    for (const file of CUSTOM_MIGRATIONS) {
      const sql = readFileSync(join(__dirname, '../../drizzle', file), 'utf-8');
      console.log(`[migrate] Running ${file}...`);
      await pool.query(sql);
      console.log(`[migrate] ${file} done.`);
    }
  } finally {
    await pool.end();
  }
}

runCustomMigrations().catch((err) => {
  console.error('[migrate] Error:', err);
  process.exit(1);
});
