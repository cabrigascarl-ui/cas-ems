import { getDb, mutate, nextId, isoNow, getMockAuthUid, setMockAuthUid } from './store.js';
import { accountStatusMessage } from '../../constants.js';
import { logActivity } from './activityLogs.js';

export async function getProfile(uid) {
  const db = getDb();
  const profile = db.users[uid];
  return profile ? { id: uid, ...profile } : null;
}

/** Demo-mode "auth": mirrors the real subscribeAuth(callback) shape/behavior. */
export function subscribeAuth(callback) {
  let cancelled = false;
  (async () => {
    const uid = getMockAuthUid();
    if (!uid) {
      if (!cancelled) callback(null);
      return;
    }
    const profile = await getProfile(uid);
    if (!cancelled) callback(profile?.status === 'approved' ? { uid, email: profile.email, ...profile } : null);
  })();
  return () => { cancelled = true; };
}

/**
 * No real password is checked in demo mode — any password works for the
 * seeded demo accounts, since there's no backend to verify against yet.
 * See services/mock/store.js for the seeded account emails.
 */
export async function login(email) {
  const db = getDb();
  const entry = Object.entries(db.users).find(([, u]) => u.email.toLowerCase() === email.toLowerCase());
  if (!entry) {
    const err = new Error('Invalid email or password.');
    err.code = 'auth/invalid-credential';
    throw err;
  }
  const [uid, profile] = entry;
  if (profile.status !== 'approved') {
    throw new Error(accountStatusMessage(profile));
  }
  setMockAuthUid(uid);
  const user = { uid, email: profile.email, ...profile };
  await logActivity(user.uid, user.fullName, 'login', 'User logged in (demo mode)');
  return user;
}

export async function logout(user) {
  if (user) {
    await logActivity(user.uid, user.fullName, 'logout', 'User logged out (demo mode)');
  }
  setMockAuthUid(null);
}

export async function registerBorrower(form) {
  if (form.password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (form.password !== form.confirmPassword) throw new Error('Passwords do not match.');
  if (!form.consent) throw new Error("You must consent to the collection of your personal data (RA 10173) to register.");

  const db = getDb();
  if (Object.values(db.users).some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
    const err = new Error('An account with that email already exists.');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  const uid = nextId('borrower');
  mutate((db) => {
    db.users[uid] = {
      fullName: form.fullName, idNumber: form.idNumber || null, email: form.email,
      program: form.program || null, section: form.section || null,
      role: 'borrower', status: 'pending', createdAt: isoNow(),
    };
  });
  await logActivity(uid, form.fullName, 'register', `Borrower registration submitted: ${form.email} (demo mode)`);
}

export async function checkAdminExists() {
  return getDb().meta.adminExists === true;
}

export async function createFirstAdmin(form) {
  if (await checkAdminExists()) throw new Error('An administrator account already exists.');
  if (form.password.length < 8) throw new Error('Password must be at least 8 characters.');

  const uid = nextId('admin');
  mutate((db) => {
    db.users[uid] = { fullName: form.fullName, email: form.email, role: 'admin', status: 'approved', createdAt: isoNow() };
    db.meta.adminExists = true;
  });
}
