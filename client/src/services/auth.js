import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { get, onValue, ref, set, update } from 'firebase/database';
import { auth, db, firebaseConfigured } from '../firebase.js';
import { accountStatusMessage } from '../constants.js';
import { logActivity } from './activityLogs.js';
import * as mock from './mock/auth.js';

async function getProfileFirebase(uid) {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? { id: uid, ...snap.val() } : null;
}

/** Keep the session usable only while its database profile is approved. */
function subscribeAuthFirebase(callback) {
  let unsubscribeProfile = null;
  const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
    unsubscribeProfile?.();
    unsubscribeProfile = null;
    if (!fbUser) {
      callback(null);
      return;
    }
    unsubscribeProfile = onValue(ref(db, `users/${fbUser.uid}`), (snap) => {
      const profile = snap.val();
      callback(profile?.status === 'approved'
        ? { uid: fbUser.uid, email: fbUser.email, ...profile }
        : null);
    }, (err) => {
      console.error('Unable to check account approval:', err);
      callback(null);
    });
  });
  return () => {
    unsubscribeProfile?.();
    unsubscribeAuth();
  };
}

async function loginFirebase(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getProfileFirebase(cred.user.uid);

  if (!profile) {
    await signOut(auth);
    throw new Error('No profile found for this account. Please contact an administrator.');
  }
  if (profile.status !== 'approved') {
    await signOut(auth);
    throw new Error(accountStatusMessage(profile));
  }

  const user = { uid: cred.user.uid, email: cred.user.email, ...profile };
  await logActivity(user.uid, user.fullName, 'login', 'User logged in');
  return user;
}

async function logoutFirebase(user) {
  if (user) {
    await logActivity(user.uid, user.fullName, 'logout', 'User logged out');
  }
  await signOut(auth);
}

async function registerBorrowerFirebase(form) {
  if (form.password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  if (form.password !== form.confirmPassword) {
    throw new Error('Passwords do not match.');
  }
  if (!form.consent) {
    throw new Error("You must consent to the collection of your personal data (RA 10173) to register.");
  }

  const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
  await set(ref(db, `users/${cred.user.uid}`), {
    fullName: form.fullName,
    idNumber: form.idNumber || null,
    email: form.email,
    program: form.program || null,
    section: form.section || null,
    role: 'borrower',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  await logActivity(cred.user.uid, form.fullName, 'register', `Borrower registration submitted: ${form.email}`);
  await signOut(auth); // stay on the "pending approval" screen rather than an unapproved session
}

async function checkAdminExistsFirebase() {
  const snap = await get(ref(db, 'meta/adminExists'));
  return snap.val() === true;
}

async function createFirstAdminFirebase(form) {
  if (await checkAdminExistsFirebase()) {
    throw new Error('An administrator account already exists.');
  }
  if (form.password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  let cred;
  let created = false;
  try {
    cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
    created = true;
  } catch (err) {
    if (err.code !== 'auth/email-already-in-use') throw err;
    cred = await signInWithEmailAndPassword(auth, form.email, form.password);
  }

  try {
    await reload(cred.user);
    if (!cred.user.emailVerified) {
      if (created) await sendEmailVerification(cred.user);
      return { verificationPending: true };
    }
    // A verified email is required by the database rules. Refresh the token
    // after verification so those rules see the new email_verified claim.
    await cred.user.getIdToken(true);
    const existingProfile = await getProfileFirebase(cred.user.uid);
    if (existingProfile) throw new Error('This email already has a CAS-EMS account.');
    await update(ref(db), {
      [`users/${cred.user.uid}`]: {
        fullName: form.fullName,
        email: cred.user.email,
        role: 'admin',
        status: 'approved',
        createdAt: new Date().toISOString(),
      },
      'meta/adminExists': true,
    });
    return { verificationPending: false };
  } finally {
    await signOut(auth); // start a normal session from the login page
  }
}

export const getProfile = firebaseConfigured ? getProfileFirebase : mock.getProfile;
export const subscribeAuth = firebaseConfigured ? subscribeAuthFirebase : mock.subscribeAuth;
export const login = firebaseConfigured ? loginFirebase : mock.login;
export const logout = firebaseConfigured ? logoutFirebase : mock.logout;
export const registerBorrower = firebaseConfigured ? registerBorrowerFirebase : mock.registerBorrower;
export const checkAdminExists = firebaseConfigured ? checkAdminExistsFirebase : mock.checkAdminExists;
export const createFirstAdmin = firebaseConfigured ? createFirstAdminFirebase : mock.createFirstAdmin;
