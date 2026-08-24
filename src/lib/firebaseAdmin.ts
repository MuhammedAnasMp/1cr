import * as admin from 'firebase-admin';

const FIREBASE_DATABASE_URL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  'https://crorepixels-default-rtdb.asia-southeast1.firebasedatabase.app';

if (!admin.apps.length) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || '1crorepixels',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@any-dm.iam.gserviceaccount.com',
        privateKey: privateKey,
      }),
      databaseURL: FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.warn('Firebase Admin initialization fallback:', error);
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;

/**
 * Firebase Admin Realtime Database reference.
 * Used by API routes to broadcast pixel events (reserve/sold/available)
 * to all connected clients in real time after PostgreSQL commits.
 */
export const adminDb = admin.apps.length ? admin.database() : null;

/**
 * Helper: write a pixel event to Firebase RTDB.
 * Silently fails if adminDb is not initialized (dev/fallback mode).
 */
export async function broadcastPixelEvent(pixelId: number, data: Record<string, any>) {
  try {
    if (!adminDb) return;
    await adminDb.ref(`/pixels/events/${pixelId}`).set({ ...data, ts: Date.now() });
  } catch (err) {
    console.warn('Firebase RTDB broadcast failed (non-critical):', err);
  }
}

/**
 * Helper: release pixel events by removing their RTDB nodes.
 */
export async function releasePixelEvents(pixelIds: number[]) {
  try {
    if (!adminDb) return;
    const updates: Record<string, null> = {};
    pixelIds.forEach((id) => { updates[`/pixels/events/${id}`] = null; });
    await adminDb.ref('/pixels/events').update(updates);
  } catch (err) {
    console.warn('Firebase RTDB release failed (non-critical):', err);
  }
}

/**
 * Helper: update the global canvas stats node.
 */
export async function updateCanvasStats(delta: { sold?: number; reserved?: number }) {
  try {
    if (!adminDb) return;
    const statsRef = adminDb.ref('/canvas/stats');
    await statsRef.transaction((current: any) => {
      const c = current || { total_sold: 0, total_reserved: 0 };
      return {
        total_sold: Math.max(0, (c.total_sold || 0) + (delta.sold || 0)),
        total_reserved: Math.max(0, (c.total_reserved || 0) + (delta.reserved || 0)),
        updated_at: Date.now(),
      };
    });
  } catch (err) {
    console.warn('Firebase RTDB stats update failed (non-critical):', err);
  }
}
