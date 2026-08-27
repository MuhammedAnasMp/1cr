import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_7yck5WtKOfNE@ep-lingering-rice-azt73z4y-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function cleanAllDatabases() {
  console.log('---------------------------------------------------------');
  console.log('🚀 Starting Clean Sweep for Neon PostgreSQL...');
  console.log('---------------------------------------------------------');

  // 1. Clean Neon PostgreSQL
  console.log('1️⃣ Truncating Neon PostgreSQL tables...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    await client.query(`
      TRUNCATE TABLE links, pixel_reservations, pixels, orders, profiles, users CASCADE;
    `);
    client.release();
    await pool.end();
    console.log('✅ Neon PostgreSQL: All tables (users, profiles, pixels, links, orders, reservations) truncated clean.');
  } catch (err: any) {
    console.error('❌ Neon PostgreSQL clean error:', err.message);
  }

  console.log('---------------------------------------------------------');
  console.log('✨ CLEAN SWEEP COMPLETE! Database is 100% fresh.');
  console.log('---------------------------------------------------------');
  process.exit(0);
}

cleanAllDatabases();
