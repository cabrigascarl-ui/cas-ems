import { get, push, query, orderByChild, ref } from 'firebase/database';
import { db, firebaseConfigured } from '../firebase.js';
import * as mock from './mock/activityLogs.js';

async function logActivityFirebase(userId, userName, action, details = '') {
  await push(ref(db, 'activityLogs'), {
    userId: userId || null,
    userName: userName || 'System',
    action,
    details,
    createdAt: new Date().toISOString(),
  });
}

/** Admin only (enforced by security rules). Client-side filter since RTDB has no full-text search. */
async function listActivityLogsFirebase(searchTerm = '') {
  const snap = await get(query(ref(db, 'activityLogs'), orderByChild('createdAt')));
  const logs = [];
  snap.forEach((child) => {
    logs.push({ id: child.key, ...child.val() });
  });
  logs.reverse(); // newest first

  if (!searchTerm) return logs.slice(0, 300);
  const term = searchTerm.toLowerCase();
  return logs
    .filter((l) => l.action?.toLowerCase().includes(term) || l.details?.toLowerCase().includes(term) || l.userName?.toLowerCase().includes(term))
    .slice(0, 300);
}

export const logActivity = firebaseConfigured ? logActivityFirebase : mock.logActivity;
export const listActivityLogs = firebaseConfigured ? listActivityLogsFirebase : mock.listActivityLogs;
