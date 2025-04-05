import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import config from '../../shared/config/env';

// Your web app's Firebase configuration from environment
const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};

// Log warning if Firebase config is incomplete
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    'Firebase configuration is incomplete. Make sure you have set the required environment variables.'
  );
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings optimized for Hebrew text
initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});

// Get Firestore instance
export const db = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Firebase Functions
export const functions = getFunctions(app);

// Export all Firebase services
export { firebaseConfig }; 