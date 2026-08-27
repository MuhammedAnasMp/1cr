import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_7yck5WtKOfNE@ep-lingering-rice-azt73z4y-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const rtdbUrl =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://vist-bio-default-rtdb.asia-southeast1.firebasedatabase.app';

async function cleanAllDatabases() {
  console.log('---------------------------------------------------------');
  console.log('🚀 Starting Clean Sweep for Neon PostgreSQL & Firebase RTDB...');
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

  // 2. Clean Firebase Realtime Database
  console.log('\n2️⃣ Purging Firebase Realtime Database nodes...');
  try {
    const url = `${rtdbUrl}/.json`;
    const cleanPayload = {
      pixels: null,
      tiles: null,
      canvas: {
        stats: {
          total_sold: 0,
          total_reserved: 0,
          updated_at: Date.now(),
        },
      },
    };

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    });

    if (res.ok) {
      console.log('✅ Firebase Realtime Database: All realtime nodes (/pixels, /tiles) purged & stats reset to 0.');
    } else {
      console.warn('⚠️ Firebase RTDB clean HTTP response status:', res.status);
    }
  } catch (err: any) {
    console.error('❌ Firebase RTDB clean error:', err.message);
  }

  console.log('---------------------------------------------------------');
  console.log('✨ CLEAN SWEEP COMPLETE! Both databases are 100% fresh.');
  console.log('---------------------------------------------------------');
  process.exit(0);
}

cleanAllDatabases();
