import { getDb, mutate, nextId, isoNow } from './store.js';

export async function logActivity(userId, userName, action, details = '') {
  mutate((db) => {
    db.activityLogs[nextId('log')] = { userId: userId || null, userName: userName || 'System', action, details, createdAt: isoNow() };
  });
}

export async function listActivityLogs(searchTerm = '') {
  const db = getDb();
  let logs = Object.entries(db.activityLogs).map(([id, val]) => ({ id, ...val }));
  logs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    logs = logs.filter((l) => l.action?.toLowerCase().includes(term) || l.details?.toLowerCase().includes(term) || l.userName?.toLowerCase().includes(term));
  }
  return logs.slice(0, 300);
}
