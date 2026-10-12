import { equalTo, get, orderByChild, push, query, ref, update } from 'firebase/database';
import { db, firebaseConfigured } from '../firebase.js';
import { listEquipment } from './equipment.js';
import { logActivity } from './activityLogs.js';
import * as mock from './mock/maintenance.js';

async function listMaintenanceFirebase(labId) {
  const source = labId
    ? query(ref(db, 'maintenance'), orderByChild('labId'), equalTo(labId))
    : ref(db, 'maintenance');
  const [snap, equipment] = await Promise.all([get(source), listEquipment()]);
  const equipmentMap = Object.fromEntries(equipment.map((e) => [e.id, e]));

  const records = [];
  snap.forEach((child) => {
    const val = child.val();
    if (labId && val.labId !== labId) return;
    const eq = equipmentMap[val.equipmentId];
    records.push({
      id: child.key,
      ...val,
      unitCode: eq?.unitCode || '—',
      equipmentName: eq?.name || 'Unknown unit',
    });
  });
  records.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return records;
}

async function addMaintenanceRecordFirebase(form, actingUser) {
  const now = new Date().toISOString();
  const recordKey = push(ref(db, 'maintenance')).key;

  // Single multi-path update commits the maintenance record and the equipment
  // status change atomically (both succeed or neither does).
  await update(ref(db), {
    [`maintenance/${recordKey}`]: {
      labId: form.labId,
      equipmentId: form.equipmentId,
      dateReported: form.dateReported,
      problem: form.problem.trim(),
      actionTaken: form.actionTaken || null,
      resultingStatus: form.resultingStatus,
      recordedBy: actingUser.uid,
      recordedByName: actingUser.fullName,
      createdAt: now,
    },
    [`equipment/${form.equipmentId}/status`]: form.resultingStatus,
    [`equipment/${form.equipmentId}/updatedAt`]: now,
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'log_maintenance', `Maintenance logged for equipment ${form.equipmentId}`);
}

export const listMaintenance = firebaseConfigured ? listMaintenanceFirebase : mock.listMaintenance;
export const addMaintenanceRecord = firebaseConfigured ? addMaintenanceRecordFirebase : mock.addMaintenanceRecord;
