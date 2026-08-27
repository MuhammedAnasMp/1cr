import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_uJ3X1CqUESBg@ep-bold-dawn-az0k6xvv-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

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
    // 1. Schema DDL
    await client.query(`
      -- Users & Self-Hosted Sessions (No Supabase, No Firebase)
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255),
        avatar TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

      -- Sovereign Countries & Regional Shards
      CREATE TABLE IF NOT EXISTS countries (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        flag VARCHAR(50),
        bounding_box JSONB NOT NULL,
        total_blocks INT DEFAULT 0,
        sold_blocks INT DEFAULT 0
      );

      -- Dynamic System Settings (Base Price, etc.)
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- Volume Pricing Tiers
      CREATE TABLE IF NOT EXISTS pricing_tiers (
        id VARCHAR(255) PRIMARY KEY,
        min_blocks INT NOT NULL,
        max_blocks INT,
        discount_percent INT DEFAULT 0,
        price_per_block INT DEFAULT 25,
        is_active BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      -- Sovereign Blocks (1 Block = 100 Pixels, 100,000 total blocks in 10M canvas)
      CREATE TABLE IF NOT EXISTS blocks (
        id VARCHAR(255) PRIMARY KEY,
        grid_x INT NOT NULL,
        grid_y INT NOT NULL,
        country_code VARCHAR(10) DEFAULT 'GLOBAL',
        owner_id VARCHAR(255),
        owner_name VARCHAR(255),
        owner_avatar TEXT,
        owner_username VARCHAR(255),
        price INT DEFAULT 25,
        status VARCHAR(50) DEFAULT 'available',
        image_url TEXT,
        config_json JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_blocks_coords ON blocks(grid_x, grid_y);
      CREATE INDEX IF NOT EXISTS idx_blocks_country ON blocks(country_code);
      CREATE INDEX IF NOT EXISTS idx_blocks_owner ON blocks(owner_id);
      CREATE INDEX IF NOT EXISTS idx_blocks_status ON blocks(status);

      -- Destination Links for Block Linktree
      CREATE TABLE IF NOT EXISTS block_links (
        id VARCHAR(255) PRIMARY KEY,
        block_id VARCHAR(255) REFERENCES blocks(id) ON DELETE CASCADE,
        platform VARCHAR(50) DEFAULT 'website',
        title TEXT NOT NULL,
        redirect_url TEXT NOT NULL,
        delay_seconds INT DEFAULT 0,
        sort_order INT DEFAULT 1,
        clicks INT DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_block_links_block ON block_links(block_id);

      -- Block Gallery Images (Up to 100 per block stored in Cloudinary)
      CREATE TABLE IF NOT EXISTS block_images (
        id VARCHAR(255) PRIMARY KEY,
        block_id VARCHAR(255) REFERENCES blocks(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        public_id VARCHAR(255),
        crop_data JSONB,
        sort_order INT DEFAULT 1
      );

      CREATE INDEX IF NOT EXISTS idx_block_images_block ON block_images(block_id);

      -- Short-TTL (60-120s) Reservation Locks for Active Checkouts
      CREATE TABLE IF NOT EXISTS block_reservations (
        block_id VARCHAR(255) PRIMARY KEY,
        grid_x INT NOT NULL,
        grid_y INT NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        razorpay_order_id VARCHAR(255),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_block_resv_expires ON block_reservations(expires_at);
      CREATE INDEX IF NOT EXISTS idx_block_resv_session ON block_reservations(session_id);

      -- Razorpay Orders
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        amount NUMERIC(10, 2),
        currency VARCHAR(10) DEFAULT 'INR',
        discount_amount NUMERIC(10, 2) DEFAULT 0,
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'created',
        block_ids JSONB,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_rzp_order ON orders(razorpay_order_id);

      -- Rate Limiting Table (Postgres-Native Throttling)
      CREATE TABLE IF NOT EXISTS rate_limits (
        key VARCHAR(255) PRIMARY KEY,
        points INT DEFAULT 1,
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);
    `);

    // 2. Seed Default Countries if table empty
    const countryCountRes = await client.query(`SELECT count(*) as count FROM countries`);
    if (parseInt(countryCountRes.rows[0]?.count || '0', 10) === 0) {
      await client.query(`
        INSERT INTO countries (code, name, flag, bounding_box, total_blocks, sold_blocks) VALUES
        ('IND', 'India', '🇮🇳', '{"minX": 0, "maxX": 249, "minY": 0, "maxY": 99}', 25000, 0),
        ('USA', 'United States', '🇺🇸', '{"minX": 250, "maxX": 449, "minY": 0, "maxY": 99}', 20000, 0),
        ('GBR', 'United Kingdom', '🇬🇧', '{"minX": 450, "maxX": 549, "minY": 0, "maxY": 99}', 10000, 0),
        ('DEU', 'Germany', '🇩🇪', '{"minX": 550, "maxX": 649, "minY": 0, "maxY": 99}', 10000, 0),
        ('JPN', 'Japan', '🇯🇵', '{"minX": 650, "maxX": 749, "minY": 0, "maxY": 99}', 10000, 0),
        ('CAN', 'Canada', '🇨🇦', '{"minX": 750, "maxX": 849, "minY": 0, "maxY": 99}', 10000, 0),
        ('AUS', 'Australia', '🇦🇺', '{"minX": 850, "maxX": 949, "minY": 0, "maxY": 99}', 10000, 0),
        ('GLB', 'Global Sovereign Zone', '🌐', '{"minX": 950, "maxX": 999, "minY": 0, "maxY": 99}', 5000, 0)
        ON CONFLICT (code) DO NOTHING;
      `);
    }

    // 3. Seed Default Pricing Tiers if table empty
    const tiersCountRes = await client.query(`SELECT count(*) as count FROM pricing_tiers`);
    if (parseInt(tiersCountRes.rows[0]?.count || '0', 10) === 0) {
      await client.query(`
        INSERT INTO pricing_tiers (id, min_blocks, max_blocks, discount_percent, price_per_block, is_active) VALUES
        ('tier_1', 1, 4, 0, 25, true),
        ('tier_2', 5, 9, 5, 23, true),
        ('tier_3', 10, 24, 10, 22, true),
        ('tier_4', 25, 49, 15, 21, true),
        ('tier_5', 50, 99, 20, 20, true),
        ('tier_6', 100, NULL, 30, 17, true)
        ON CONFLICT (id) DO NOTHING;
      `);
    }
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
