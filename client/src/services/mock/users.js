import { getDb, mutate, nextId, isoNow } from './store.js';
import { logActivity } from './activityLogs.js';

export async function listUsers(role) {
  const db = getDb();
  let users = Object.entries(db.users).map(([id, val]) => ({ id, ...val }));
  if (role) users = users.filter((u) => u.role === role);
  users.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return users;
}

export async function createStaffAccount({ fullName, email, role, labId, password }, actingUser) {
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (role === 'lab_custodian' && !labId) throw new Error('Please select which laboratory this custodian will manage.');
  const db = getDb();
  if (Object.values(db.users).some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    const err = new Error('A user with that email already exists.');
    err.code = 'auth/email-already-in-use';
    throw err;
  }
  const uid = nextId('staff');
  mutate((db) => {
    db.users[uid] = { fullName, email, role, labId: role === 'lab_custodian' ? labId : null, status: 'approved', createdAt: isoNow() };
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'create_user', `Created ${role} account: ${email} (demo mode)`);
}

export async function setUserStatus(userId, status, actingUser, reason) {
  mutate((db) => {
    db.users[userId] = { ...db.users[userId], status, rejectionReason: status === 'rejected' ? (reason || null) : null };
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'update_user_status', `User ${userId} set to ${status}${reason ? ` (${reason})` : ''} (demo mode)`);
}
