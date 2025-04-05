import * as admin from 'firebase-admin';
import { config } from '../config/env';

/**
 * Initialize Firebase Admin SDK for server-side operations
 * Used for:
 * - Authentication verification
 * - Firestore database access
 * - Cloud Storage access
 */

// Check if the app has already been initialized
let firebaseApp: admin.app.App;

try {
  // Try to get the default app, which will throw if it doesn't exist
  firebaseApp = admin.app();
} catch (error) {
  // Initialize Firebase admin if not already initialized
  const serviceAccount = config.firebase.serviceAccount;
  
  if (!serviceAccount) {
    console.error('Firebase service account is not configured');
    process.exit(1);
  }
  
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: config.firebase.databaseURL,
    storageBucket: config.firebase.storageBucket
  });
  
  console.log('Firebase Admin initialized');
}

// Export Firebase services
export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();
export const messaging = admin.messaging();

// Helper for Firestore timestamp
export const timestamp = admin.firestore.FieldValue.serverTimestamp;
export const increment = admin.firestore.FieldValue.increment;
export const arrayUnion = admin.firestore.FieldValue.arrayUnion;
export const arrayRemove = admin.firestore.FieldValue.arrayRemove;

// Export the admin instance
export default admin; 