import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_7yck5WtKOfNE@ep-lingering-rice-azt73z4y-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
});

let isInitialized = false;

export async function initPostgres() {
  if (isInitialized) return pool;

  const client = await pool.connect();
  try {
    // Pure DDL Schema Creation for Neon PostgreSQL
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        firebase_uid VARCHAR(255),
        email VARCHAR(255),
        name VARCHAR(255),
        avatar TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profiles (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        username VARCHAR(255) UNIQUE,
        name VARCHAR(255),
        bio TEXT,
        avatar TEXT,
        theme_color VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pixels (
        id BIGINT PRIMARY KEY,
        x INT,
        y INT,
        owner_id VARCHAR(255),
        owner_name VARCHAR(255),
        owner_avatar TEXT,
        price INT DEFAULT 10,
        status VARCHAR(50) DEFAULT 'available',
        color VARCHAR(50),
        profile_id VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS links (
        id VARCHAR(255) PRIMARY KEY,
        profile_id VARCHAR(255),
        title TEXT,
        url TEXT,
        sort_order INT DEFAULT 1,
        clicks INT DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        amount INT,
        razorpay_order_id VARCHAR(255),
        status VARCHAR(50),
        pixels_count INT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
  isInitialized = true;

  return pool;
}

export function getDb() {
  return pool;
}

export default pool;
