import { equalTo, get, orderByChild, push, query, ref, update } from 'firebase/database';
import { db, firebaseConfigured } from '../firebase.js';
import { listCategories } from './equipment.js';
import { logActivity } from './activityLogs.js';
import * as mock from './mock/transactions.js';

async function enrich(transactions) {
  const categories = await listCategories();
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  return transactions.map((t) => ({ ...t, categoryName: categoryMap[t.categoryId] || 'Unknown' }));
}

function newGroupId() {
  return `grp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function equipmentStatusForCondition(condition) {
  if (condition === 'good') return 'available';
  if (condition === 'lost') return 'unserviceable';
  return 'under_maintenance'; // needs_repair, damaged
}

/** Pass no labId for the admin's all-labs view. */
async function listAllTransactionsFirebase(labId) {
  const source = labId
    ? query(ref(db, 'transactions'), orderByChild('labId'), equalTo(labId))
    : ref(db, 'transactions');
  const snap = await get(source);
  const list = [];
  snap.forEach((child) => {
    const val = child.val();
    if (labId && val.labId !== labId) return;
    list.push({ id: child.key, ...val });
  });
  list.sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
  return enrich(list);
}

async function listMyTransactionsFirebase(uid) {
  const q = query(ref(db, 'transactions'), orderByChild('borrowerId'), equalTo(uid));
  const snap = await get(q);
  const list = [];
  snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
  list.sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
  return enrich(list);
}

/**
 * Submits one or more request lines (a "cart") as a single batch — e.g. 2
 * beakers + 1 box of gloves in one go. Each line becomes its own transaction
 * (kind: 'durable' | 'consumable') so the existing per-category
 * approve/release/issue flow is untouched; they just share a `groupId` so
 * the UI can display/cancel them together.
 */
async function createTransactionFirebase(items, borrower) {
  const groupId = items.length > 1 ? newGroupId() : null;
  const now = new Date().toISOString();
  for (const form of items) {
    await push(ref(db, 'transactions'), {
      kind: form.kind,
      labId: form.labId,
      categoryId: form.categoryId,
      equipmentId: null,
      groupId,
      borrowerId: borrower.uid,
      borrowerName: borrower.fullName,
      purpose: form.purpose || null,
      expectedReturn: form.kind === 'durable' ? (form.expectedReturn || null) : null,
      quantity: form.kind === 'consumable' ? Number(form.quantity) : null,
      status: 'pending',
      requestedAt: now,
    });
  }
  await logActivity(
    borrower.uid, borrower.fullName, 'borrow_request',
    items.length > 1 ? `Submitted a request with ${items.length} items` : `Requested ${items[0].kind === 'consumable' ? `${items[0].quantity} unit(s) of` : 'a unit from'} category ${items[0].categoryId}`
  );
}

/** Durable/consumable: approve/reject a pending request. `reason` is stored when rejecting. */
async function decideTransactionFirebase(id, status, actingUser, reason) {
  await update(ref(db, `transactions/${id}`), {
    status,
    decidedBy: actingUser.uid,
    decidedAt: new Date().toISOString(),
    rejectionReason: status === 'rejected' ? (reason || null) : null,
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'borrow_decision', `Transaction ${id} ${status}${reason ? ` (${reason})` : ''}`);
}

/** Borrower withdraws their own request while it's still pending. */
async function cancelTransactionFirebase(id, actingUser) {
  const snap = await get(ref(db, `transactions/${id}`));
  if (!snap.exists()) throw new Error('Request not found.');
  const tx = snap.val();
  if (tx.borrowerId !== actingUser.uid) throw new Error('You can only cancel your own requests.');
  if (tx.status !== 'pending') throw new Error('Only pending requests can be cancelled.');
  await update(ref(db, `transactions/${id}`), { status: 'cancelled', cancelledAt: new Date().toISOString() });
  await logActivity(actingUser.uid, actingUser.fullName, 'cancel_request', `Cancelled transaction ${id}`);
}

/** Custodian picks the specific durable unit to hand over — no scanning, just a dropdown of that lab's available units. */
async function releaseTransactionFirebase(transactionId, equipmentId, actingUser) {
  const [txSnap, unitSnap] = await Promise.all([
    get(ref(db, `transactions/${transactionId}`)),
    get(ref(db, `equipment/${equipmentId}`)),
  ]);
  if (!txSnap.exists()) throw new Error('Transaction not found.');
  if (!unitSnap.exists()) throw new Error('Selected unit not found.');
  const tx = txSnap.val();
  const unit = unitSnap.val();
  if (!['pending', 'approved'].includes(tx.status)) throw new Error('This transaction has already been processed.');
  if (unit.status !== 'available') throw new Error('That unit is no longer available.');
  if (unit.categoryId !== tx.categoryId) throw new Error('That unit does not belong to the requested category.');

  const now = new Date().toISOString();
  await update(ref(db), {
    [`transactions/${transactionId}/equipmentId`]: equipmentId,
    [`transactions/${transactionId}/unitCode`]: unit.unitCode || null,
    [`transactions/${transactionId}/status`]: 'released',
    [`transactions/${transactionId}/releasedBy`]: actingUser.uid,
    [`transactions/${transactionId}/releasedByName`]: actingUser.fullName,
    [`transactions/${transactionId}/releasedAt`]: now,
    [`transactions/${transactionId}/decidedBy`]: tx.decidedBy || actingUser.uid,
    [`transactions/${transactionId}/decidedAt`]: tx.decidedAt || now,
    [`equipment/${equipmentId}/status`]: 'borrowed',
    [`equipment/${equipmentId}/updatedAt`]: now,
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'release_equipment', `Released ${unit.unitCode || equipmentId} for transaction ${transactionId}`);
}

/**
 * Durable only: custodian records the outcome on return — the unit is
 * already known from the transaction, nothing to scan/confirm. `condition`
 * 'lost' records that the item never came back rather than a physical
 * hand-off, and retires the unit (unserviceable) instead of queuing repair.
 */
async function returnTransactionFirebase(transactionId, condition, remarks, actingUser) {
  const txSnap = await get(ref(db, `transactions/${transactionId}`));
  if (!txSnap.exists()) throw new Error('Transaction not found.');
  const tx = txSnap.val();
  if (tx.status !== 'released') throw new Error('This transaction is not currently released.');

  const newEquipmentStatus = equipmentStatusForCondition(condition);
  const now = new Date().toISOString();

  await update(ref(db), {
    [`transactions/${transactionId}/status`]: 'returned',
    [`transactions/${transactionId}/returnedAt`]: now,
    [`transactions/${transactionId}/returnCondition`]: condition,
    [`transactions/${transactionId}/receivedBy`]: actingUser.uid,
    [`transactions/${transactionId}/receivedByName`]: actingUser.fullName,
    [`transactions/${transactionId}/remarks`]: remarks || null,
    [`equipment/${tx.equipmentId}/status`]: newEquipmentStatus,
    [`equipment/${tx.equipmentId}/updatedAt`]: now,
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'return_equipment', `Returned ${tx.unitCode || tx.equipmentId} for transaction ${transactionId} (${condition})`);
}

/**
 * Consumable only: approve + issue in one step. Custodian picks which stock
 * entry to draw from and confirms the quantity, which decrements
 * equipment.stockQuantity atomically alongside the transaction update.
 */
async function issueConsumableFirebase(transactionId, equipmentId, quantity, actingUser) {
  const [txSnap, itemSnap] = await Promise.all([
    get(ref(db, `transactions/${transactionId}`)),
    get(ref(db, `equipment/${equipmentId}`)),
  ]);
  if (!txSnap.exists()) throw new Error('Transaction not found.');
  if (!itemSnap.exists()) throw new Error('Selected item not found.');
  const tx = txSnap.val();
  const item = itemSnap.val();
  if (tx.status !== 'pending') throw new Error('This request has already been processed.');
  if (item.categoryId !== tx.categoryId) throw new Error('That item does not belong to the requested category.');
  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new Error('Enter a valid quantity to issue.');
  if (qty > item.stockQuantity) throw new Error(`Only ${item.stockQuantity} ${item.unitOfMeasure} left in stock.`);

  const now = new Date().toISOString();
  await update(ref(db), {
    [`transactions/${transactionId}/equipmentId`]: equipmentId,
    [`transactions/${transactionId}/quantity`]: qty,
    [`transactions/${transactionId}/status`]: 'issued',
    [`transactions/${transactionId}/decidedBy`]: actingUser.uid,
    [`transactions/${transactionId}/decidedAt`]: now,
    [`transactions/${transactionId}/issuedBy`]: actingUser.uid,
    [`transactions/${transactionId}/issuedByName`]: actingUser.fullName,
    [`transactions/${transactionId}/issuedAt`]: now,
    [`equipment/${equipmentId}/stockQuantity`]: item.stockQuantity - qty,
    [`equipment/${equipmentId}/updatedAt`]: now,
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'issue_consumable', `Issued ${qty} ${item.unitOfMeasure} of "${item.name}" for transaction ${transactionId}`);
}

export const listAllTransactions = firebaseConfigured ? listAllTransactionsFirebase : mock.listAllTransactions;
export const listMyTransactions = firebaseConfigured ? listMyTransactionsFirebase : mock.listMyTransactions;
export const createTransaction = firebaseConfigured ? createTransactionFirebase : mock.createTransaction;
export const decideTransaction = firebaseConfigured ? decideTransactionFirebase : mock.decideTransaction;
export const cancelTransaction = firebaseConfigured ? cancelTransactionFirebase : mock.cancelTransaction;
export const releaseTransaction = firebaseConfigured ? releaseTransactionFirebase : mock.releaseTransaction;
export const returnTransaction = firebaseConfigured ? returnTransactionFirebase : mock.returnTransaction;
export const issueConsumable = firebaseConfigured ? issueConsumableFirebase : mock.issueConsumable;
