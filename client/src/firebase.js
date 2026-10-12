import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// True only once every required key is present. Missing keys are common
// during first-time setup (client/.env.local not created yet) — we check
// this up front so the rest of the app can show a helpful setup screen
// instead of a blank page when Firebase can't initialize.
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.databaseURL && firebaseConfig.projectId
);

export let app = null;
export let auth = null;
export let db = null;

if (firebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
  } catch (err) {
    console.error('Firebase failed to initialize:', err);
  }
}

/**
 * Creates a Firebase Auth user without signing out the currently logged-in
 * admin. Used when an Administrator creates Custodian/Staff/Admin accounts:
 * createUserWithEmailAndPassword on the *default* app would otherwise swap
 * the active session to the newly created user. We spin up a throwaway
 * secondary app instance, use it just for account creation, then discard it.
 */
export async function getSecondaryAuth() {
  const name = 'secondary';
  const existing = getApps().find((a) => a.name === name);
  if (existing) {
    await deleteApp(existing);
  }
  const secondaryApp = initializeApp(firebaseConfig, name);
  return { secondaryApp, secondaryAuth: getAuth(secondaryApp) };
}
