import { pool, initPostgres } from '@/lib/db';

/**
 * PostgreSQL-Native Rate Limiting (No Redis / No Upstash)
 * @param key unique identifier for throttle (e.g. IP + endpoint, or user_id)
 * @param maxPoints max allowed requests in time window
 * @param windowSeconds time window in seconds
 */
export async function checkRateLimit(
  key: string,
  maxPoints: number = 60,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    await initPostgres();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

    const client = await pool.connect();
    try {
      // Clean up expired tokens occasionally
      await client.query(`DELETE FROM rate_limits WHERE expires_at < NOW()`).catch(() => {});

      // Upsert rate limit count
      const res = await client.query(
        `INSERT INTO rate_limits (key, points, expires_at)
         VALUES ($1, 1, $2)
         ON CONFLICT (key) DO UPDATE
           SET points = CASE
             WHEN rate_limits.expires_at < NOW() THEN 1
             ELSE rate_limits.points + 1
           END,
           expires_at = CASE
             WHEN rate_limits.expires_at < NOW() THEN $2
             ELSE rate_limits.expires_at
           END
         RETURNING points, expires_at`,
        [key, expiresAt]
      );

      const row = res.rows[0];
      const points = row?.points || 1;
      const rowExpiresAt = new Date(row?.expires_at || expiresAt);
      const remaining = Math.max(0, maxPoints - points);

      return {
        allowed: points <= maxPoints,
        remaining,
        resetAt: rowExpiresAt,
      };
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('Rate limiter fallback (allowed):', err);
    return {
      allowed: true,
      remaining: maxPoints,
      resetAt: new Date(Date.now() + windowSeconds * 1000),
    };
  }
}
