import { equalTo, get, orderByChild, push, query, ref, set, update } from 'firebase/database';
import { db, firebaseConfigured } from '../firebase.js';
import { expiryState } from '../constants.js';
import { logActivity } from './activityLogs.js';
import * as mock from './mock/equipment.js';

async function listCategoriesFirebase(labId) {
  const snap = await get(ref(db, 'categories'));
  const categories = [];
  snap.forEach((child) => {
    const val = child.val();
    if (!labId || val.labId === labId) categories.push({ id: child.key, ...val });
  });
  categories.sort((a, b) => a.name.localeCompare(b.name));
  return categories;
}

async function addCategoryFirebase(name, labId) {
  const snap = await get(ref(db, 'categories'));
  let exists = false;
  snap.forEach((child) => {
    const val = child.val();
    if (val.labId === labId && val.name.toLowerCase() === name.toLowerCase()) exists = true;
  });
  if (exists) return;
  await push(ref(db, 'categories'), { name, labId });
}

/** Pass no labId to get the whole college's inventory (used by the admin's cross-lab overview). */
async function listEquipmentFirebase(labId) {
  const snap = await get(ref(db, 'equipment'));
  const categories = await listCategoriesFirebase();
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const list = [];
  snap.forEach((child) => {
    const val = child.val();
    if (labId && val.labId !== labId) return;
    list.push({ id: child.key, ...val, categoryName: categoryMap[val.categoryId] || 'Uncategorized' });
  });
  list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return list;
}

async function findAvailableByCategoryFirebase(categoryId, { includeExpired = false } = {}) {
  const all = await listEquipmentFirebase();
  return all.filter((e) => {
    if (e.categoryId !== categoryId || e.itemType !== 'durable' || e.status !== 'available') return false;
    if (!includeExpired && expiryState(e.expirationDate) === 'expired') return false;
    return true;
  });
}

async function findConsumablesByCategoryFirebase(categoryId, { includeExpired = false } = {}) {
  const all = await listEquipmentFirebase();
  return all.filter((e) => {
    if (e.categoryId !== categoryId || e.itemType !== 'consumable' || e.stockQuantity <= 0) return false;
    if (!includeExpired && expiryState(e.expirationDate) === 'expired') return false;
    return true;
  });
}

async function getEquipmentDetailFirebase(id) {
  const [eqSnap, categories] = await Promise.all([get(ref(db, `equipment/${id}`)), listCategoriesFirebase()]);
  if (!eqSnap.exists()) return null;
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const equipment = { id, ...eqSnap.val(), categoryName: categoryMap[eqSnap.val().categoryId] || 'Uncategorized' };

  const [txSnap, maintSnap] = await Promise.all([
    get(query(ref(db, 'transactions'), orderByChild('equipmentId'), equalTo(id))),
    get(query(ref(db, 'maintenance'), orderByChild('equipmentId'), equalTo(id))),
  ]);
  const transactions = [];
  txSnap.forEach((child) => transactions.push({ id: child.key, ...child.val() }));
  transactions.sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));

  const maintenance = [];
  maintSnap.forEach((child) => maintenance.push({ id: child.key, ...child.val() }));
  maintenance.sort((a, b) => (b.dateReported || '').localeCompare(a.dateReported || ''));

  return { equipment, transactions, maintenance };
}

async function addEquipmentFirebase(form, actingUser) {
  const now = new Date().toISOString();
  const newRef = push(ref(db, 'equipment'));
  const base = {
    labId: form.labId,
    categoryId: form.categoryId,
    name: form.name.trim(),
    description: form.description || null,
    itemType: form.itemType,
    expirationDate: form.expirationDate || null,
    dateAcquired: form.dateAcquired || null,
    createdAt: now,
    updatedAt: now,
  };
  const typeFields = form.itemType === 'durable'
    ? { unitCode: form.unitCode?.trim() || null, status: 'available' }
    : {
        stockQuantity: Number(form.stockQuantity) || 0,
        unitOfMeasure: form.unitOfMeasure?.trim() || 'units',
        reorderThreshold: form.reorderThreshold ? Number(form.reorderThreshold) : null,
      };
  await set(newRef, { ...base, ...typeFields });
  await logActivity(actingUser.uid, actingUser.fullName, 'register_equipment', `Registered ${form.itemType} item "${form.name}"`);
  return newRef.key;
}

/** Look up a single durable unit by its unitCode (case-insensitive). Returns null if not found. */
async function findEquipmentByUnitCodeFirebase(unitCode) {
  const all = await listEquipmentFirebase();
  const needle = unitCode.trim().toLowerCase();
  return all.find((e) => e.itemType === 'durable' && e.unitCode && e.unitCode.toLowerCase() === needle) || null;
}

async function setEquipmentStatusFirebase(id, status, actingUser) {
  await update(ref(db, `equipment/${id}`), { status, updatedAt: new Date().toISOString() });
  await logActivity(actingUser.uid, actingUser.fullName, 'update_equipment_status', `Equipment ${id} set to ${status}`);
}

async function restockConsumableFirebase(id, addQuantity, newExpirationDate, actingUser) {
  const snap = await get(ref(db, `equipment/${id}`));
  if (!snap.exists()) throw new Error('Item not found.');
  const current = snap.val();
  const now = new Date().toISOString();
  await update(ref(db, `equipment/${id}`), {
    stockQuantity: (current.stockQuantity || 0) + Number(addQuantity),
    expirationDate: newExpirationDate || current.expirationDate,
    updatedAt: now,
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'restock_consumable', `Added ${addQuantity} ${current.unitOfMeasure || 'units'} to "${current.name}"`);
}

export const findEquipmentByUnitCode = firebaseConfigured ? findEquipmentByUnitCodeFirebase : mock.findEquipmentByUnitCode;
export const listCategories = firebaseConfigured ? listCategoriesFirebase : mock.listCategories;
export const addCategory = firebaseConfigured ? addCategoryFirebase : mock.addCategory;
export const listEquipment = firebaseConfigured ? listEquipmentFirebase : mock.listEquipment;
export const findAvailableByCategory = firebaseConfigured ? findAvailableByCategoryFirebase : mock.findAvailableByCategory;
export const findConsumablesByCategory = firebaseConfigured ? findConsumablesByCategoryFirebase : mock.findConsumablesByCategory;
export const getEquipmentDetail = firebaseConfigured ? getEquipmentDetailFirebase : mock.getEquipmentDetail;
export const addEquipment = firebaseConfigured ? addEquipmentFirebase : mock.addEquipment;
export const setEquipmentStatus = firebaseConfigured ? setEquipmentStatusFirebase : mock.setEquipmentStatus;
export const restockConsumable = firebaseConfigured ? restockConsumableFirebase : mock.restockConsumable;
