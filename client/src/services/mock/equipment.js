import { getDb, mutate, nextId, isoNow } from './store.js';
import { expiryState } from '../../constants.js';
import { logActivity } from './activityLogs.js';

export async function listCategories(labId) {
  const db = getDb();
  let categories = Object.entries(db.categories).map(([id, val]) => ({ id, ...val }));
  if (labId) categories = categories.filter((c) => c.labId === labId);
  categories.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}

export async function addCategory(name, labId) {
  const db = getDb();
  if (Object.values(db.categories).some((c) => c.labId === labId && c.name.toLowerCase() === name.toLowerCase())) return;
  mutate((db) => {
    db.categories[nextId('cat')] = { name, labId };
  });
}

/** Pass no labId to get the whole college's inventory (used by the admin's cross-lab overview). */
export async function listEquipment(labId) {
  const db = getDb();
  const categoryMap = Object.fromEntries(Object.entries(db.categories).map(([id, c]) => [id, c.name]));
  let list = Object.entries(db.equipment).map(([id, val]) => ({ id, ...val, categoryName: categoryMap[val.categoryId] || 'Uncategorized' }));
  if (labId) list = list.filter((e) => e.labId === labId);
  list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return list;
}

export async function findAvailableByCategory(categoryId, { includeExpired = false } = {}) {
  const all = await listEquipment();
  return all.filter((e) => {
    if (e.categoryId !== categoryId || e.itemType !== 'durable' || e.status !== 'available') return false;
    if (!includeExpired && expiryState(e.expirationDate) === 'expired') return false;
    return true;
  });
}

export async function findConsumablesByCategory(categoryId, { includeExpired = false } = {}) {
  const all = await listEquipment();
  return all.filter((e) => {
    if (e.categoryId !== categoryId || e.itemType !== 'consumable' || e.stockQuantity <= 0) return false;
    if (!includeExpired && expiryState(e.expirationDate) === 'expired') return false;
    return true;
  });
}

export async function getEquipmentDetail(id) {
  const db = getDb();
  const eq = db.equipment[id];
  if (!eq) return null;
  const categoryMap = Object.fromEntries(Object.entries(db.categories).map(([cid, c]) => [cid, c.name]));
  const equipment = { id, ...eq, categoryName: categoryMap[eq.categoryId] || 'Uncategorized' };

  const transactions = Object.entries(db.transactions)
    .filter(([, t]) => t.equipmentId === id)
    .map(([tid, t]) => ({ id: tid, ...t }))
    .sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));

  const maintenance = Object.entries(db.maintenance)
    .filter(([, m]) => m.equipmentId === id)
    .map(([mid, m]) => ({ id: mid, ...m }))
    .sort((a, b) => (b.dateReported || '').localeCompare(a.dateReported || ''));

  return { equipment, transactions, maintenance };
}

export async function addEquipment(form, actingUser) {
  const now = isoNow();
  const id = nextId('eq');
  const base = {
    labId: form.labId, categoryId: form.categoryId, name: form.name.trim(),
    description: form.description || null, itemType: form.itemType,
    expirationDate: form.expirationDate || null, dateAcquired: form.dateAcquired || null,
    createdAt: now, updatedAt: now,
  };
  const typeFields = form.itemType === 'durable'
    ? { unitCode: form.unitCode?.trim() || null, status: 'available' }
    : {
        stockQuantity: Number(form.stockQuantity) || 0,
        unitOfMeasure: form.unitOfMeasure?.trim() || 'units',
        reorderThreshold: form.reorderThreshold ? Number(form.reorderThreshold) : null,
      };
  mutate((db) => {
    db.equipment[id] = { ...base, ...typeFields };
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'register_equipment', `Registered ${form.itemType} item "${form.name}" (demo mode)`);
  return id;
}

export async function setEquipmentStatus(id, status, actingUser) {
  mutate((db) => {
    db.equipment[id] = { ...db.equipment[id], status, updatedAt: isoNow() };
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'update_equipment_status', `Equipment ${id} set to ${status} (demo mode)`);
}

export async function restockConsumable(id, addQuantity, newExpirationDate, actingUser) {
  const db = getDb();
  const current = db.equipment[id];
  if (!current) throw new Error('Item not found.');
  mutate((db) => {
    db.equipment[id] = {
      ...db.equipment[id],
      stockQuantity: (current.stockQuantity || 0) + Number(addQuantity),
      expirationDate: newExpirationDate || current.expirationDate,
      updatedAt: isoNow(),
    };
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'restock_consumable', `Added ${addQuantity} ${current.unitOfMeasure || 'units'} to "${current.name}" (demo mode)`);
}

export async function findEquipmentByUnitCode(unitCode) {
  const all = await listEquipment();
  const needle = unitCode.trim().toLowerCase();
  return all.find((e) => e.itemType === 'durable' && e.unitCode && e.unitCode.toLowerCase() === needle) || null;
}
