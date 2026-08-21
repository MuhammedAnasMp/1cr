import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || '1crorepixels',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@any-dm.iam.gserviceaccount.com',
        privateKey: privateKey,
      }),
    });
  } catch (error) {
    console.warn('Firebase Admin initialization fallback:', error);
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
