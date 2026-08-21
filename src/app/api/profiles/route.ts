import { NextResponse } from 'next/server';
import { initPostgres, pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { user_id, profile } = await request.json();
    await initPostgres();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Upsert Profile
      await client.query(`
        INSERT INTO profiles (id, user_id, username, name, bio, avatar, theme_color, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE
        SET username = EXCLUDED.username, name = EXCLUDED.name, bio = EXCLUDED.bio, avatar = EXCLUDED.avatar, theme_color = EXCLUDED.theme_color
      `, [profile.id, user_id, profile.username, profile.name, profile.bio, profile.avatar, profile.theme_color || '#00e5ff']);

      // 2. Delete and recreate links
      await client.query(`DELETE FROM links WHERE profile_id = $1`, [profile.id]);
      for (const link of (profile.links || [])) {
        await client.query(`
          INSERT INTO links (id, profile_id, title, url, sort_order, clicks)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [link.id || `link_${Math.random()}`, profile.id, link.title, link.url, link.sort_order || 1, link.clicks || 0]);
      }

      // 3. Update pixels table with new user name and avatar info for leaderboard consistency
      await client.query(`
        UPDATE pixels 
        SET owner_name = $1, owner_avatar = $2 
        WHERE owner_id = $3
      `, [profile.name, profile.avatar, user_id]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({ status: 'success', message: 'Profile saved successfully' });
  } catch (err: any) {
    console.error('Error saving profile changes:', err);
    return NextResponse.json({ error: 'Failed to update profile', details: err.message }, { status: 500 });
  }
}
