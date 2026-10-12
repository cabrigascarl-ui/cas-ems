import { getDb, mutate, nextId, isoNow } from './store.js';
import { logActivity } from './activityLogs.js';

export async function listMaintenance(labId) {
  const db = getDb();
  const equipmentMap = Object.fromEntries(Object.entries(db.equipment).map(([id, e]) => [id, e]));
  let records = Object.entries(db.maintenance).map(([id, val]) => {
    const eq = equipmentMap[val.equipmentId];
    return { id, ...val, unitCode: eq?.unitCode || '—', equipmentName: eq?.name || 'Unknown unit' };
  });
  if (labId) records = records.filter((r) => r.labId === labId);
  records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return records;
}

export async function addMaintenanceRecord(form, actingUser) {
  const now = isoNow();
  const recordId = nextId('mt');
  mutate((db) => {
    db.maintenance[recordId] = {
      labId: form.labId, equipmentId: form.equipmentId, dateReported: form.dateReported, problem: form.problem.trim(),
      actionTaken: form.actionTaken || null, resultingStatus: form.resultingStatus,
      recordedBy: actingUser.uid, recordedByName: actingUser.fullName, createdAt: now,
    };
    if (db.equipment[form.equipmentId]) {
      db.equipment[form.equipmentId] = { ...db.equipment[form.equipmentId], status: form.resultingStatus, updatedAt: now };
    }
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'log_maintenance', `Maintenance logged for equipment ${form.equipmentId} (demo mode)`);
}
