import crypto from 'crypto';
import { cookies } from 'next/headers';
import { pool, initPostgres } from '@/lib/db';
import { User } from '@/types';

const SESSION_COOKIE_NAME = 'vist_bio_session';
const SESSION_EXPIRY_DAYS = 30;

/**
 * Cryptographic Password Hashing via native Node.js crypto
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  } catch (e) {
    return false;
  }
}

/**
 * Register a new user in Neon PostgreSQL
 */
export async function registerUser(
  email: string,
  password?: string,
  name?: string,
  avatar?: string
): Promise<User> {
  await initPostgres();
  const client = await pool.connect();
  try {
    const id = `u_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const passwordHash = password ? hashPassword(password) : null;
    const userEmail = email.toLowerCase().trim();
    const displayName = name || userEmail.split('@')[0] || 'Land Sovereign';
    const userAvatar = avatar || `https://i.pravatar.cc/200?u=${encodeURIComponent(userEmail)}`;

    const res = await client.query(
      `INSERT INTO users (id, email, password_hash, name, avatar, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, email, name, avatar, created_at`,
      [id, userEmail, passwordHash, displayName, userAvatar]
    );

    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar: row.avatar,
      firebase_uid: row.id,
      created_at: new Date(row.created_at).toISOString(),
    };
  } finally {
    client.release();
  }
}

/**
 * Verify credentials and create a session
 */
export async function authenticateUser(email: string, password?: string): Promise<{ user: User; token: string }> {
  await initPostgres();
  const client = await pool.connect();
  try {
    const userEmail = email.toLowerCase().trim();
    const res = await client.query(`SELECT * FROM users WHERE email = $1`, [userEmail]);
    let userRow = res.rows[0];

    if (!userRow) {
      // Auto-provision user if passwordless / quick signup
      userRow = await registerUser(userEmail, password);
    } else if (password && userRow.password_hash) {
      const isMatch = verifyPassword(password, userRow.password_hash);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }
    }

    // Create session in Neon DB
    const token = crypto.randomBytes(32).toString('hex');
    const sessionId = `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [sessionId, userRow.id, token, expiresAt]
    );

    const user: User = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name || userEmail.split('@')[0],
      avatar: userRow.avatar || `https://i.pravatar.cc/200?u=${encodeURIComponent(userEmail)}`,
      firebase_uid: userRow.id,
      created_at: new Date(userRow.created_at).toISOString(),
    };

    return { user, token };
  } finally {
    client.release();
  }
}

/**
 * Get current authenticated user from session token
 */
export async function getSessionUser(token?: string): Promise<User | null> {
  if (!token) return null;
  await initPostgres();

  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT u.id, u.email, u.name, u.avatar, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    );

    const row = res.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar: row.avatar,
      firebase_uid: row.id,
      created_at: new Date(row.created_at).toISOString(),
    };
  } catch (err) {
    console.error('Error verifying session:', err);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Delete a session token
 */
export async function destroySession(token: string): Promise<void> {
  try {
    await initPostgres();
    await pool.query(`DELETE FROM sessions WHERE token = $1`, [token]);
  } catch (e) {}
}
