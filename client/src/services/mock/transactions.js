import { getDb, mutate, nextId, isoNow } from './store.js';
import { logActivity } from './activityLogs.js';

function enrich(db, transactions) {
  const categoryMap = Object.fromEntries(Object.entries(db.categories).map(([id, c]) => [id, c.name]));
  return transactions.map((t) => ({ ...t, categoryName: categoryMap[t.categoryId] || 'Unknown' }));
}

function equipmentStatusForCondition(condition) {
  if (condition === 'good') return 'available';
  if (condition === 'lost') return 'unserviceable';
  return 'under_maintenance'; // needs_repair, damaged
}

/** Pass no labId for the admin's all-labs view. */
export async function listAllTransactions(labId) {
  const db = getDb();
  let list = Object.entries(db.transactions).map(([id, val]) => ({ id, ...val }));
  if (labId) list = list.filter((t) => t.labId === labId);
  list.sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
  return enrich(db, list);
}

export async function listMyTransactions(uid) {
  const all = await listAllTransactions();
  return all.filter((t) => t.borrowerId === uid);
}

/** items: array of {kind, labId, categoryId, purpose, expectedReturn, quantity} — a "cart" submitted as one batch. */
export async function createTransaction(items, borrower) {
  const groupId = items.length > 1 ? nextId('grp') : null;
  mutate((db) => {
    for (const form of items) {
      const id = nextId('tx');
      db.transactions[id] = {
        kind: form.kind, labId: form.labId, categoryId: form.categoryId, equipmentId: null, groupId,
        borrowerId: borrower.uid, borrowerName: borrower.fullName, purpose: form.purpose || null,
        expectedReturn: form.kind === 'durable' ? (form.expectedReturn || null) : null,
        quantity: form.kind === 'consumable' ? Number(form.quantity) : null,
        status: 'pending', requestedAt: isoNow(),
      };
    }
  });
  await logActivity(
    borrower.uid, borrower.fullName, 'borrow_request',
    items.length > 1 ? `Submitted a request with ${items.length} items (demo mode)` : `Requested ${items[0].kind === 'consumable' ? `${items[0].quantity} unit(s) of` : 'a unit from'} category ${items[0].categoryId} (demo mode)`
  );
}

export async function decideTransaction(id, status, actingUser, reason) {
  mutate((db) => {
    db.transactions[id] = {
      ...db.transactions[id], status, decidedBy: actingUser.uid, decidedAt: isoNow(),
      rejectionReason: status === 'rejected' ? (reason || null) : null,
    };
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'borrow_decision', `Transaction ${id} ${status}${reason ? ` (${reason})` : ''} (demo mode)`);
}

export async function cancelTransaction(id, actingUser) {
  const db = getDb();
  const tx = db.transactions[id];
  if (!tx) throw new Error('Request not found.');
  if (tx.borrowerId !== actingUser.uid) throw new Error('You can only cancel your own requests.');
  if (tx.status !== 'pending') throw new Error('Only pending requests can be cancelled.');
  mutate((db) => {
    db.transactions[id] = { ...db.transactions[id], status: 'cancelled', cancelledAt: isoNow() };
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'cancel_request', `Cancelled transaction ${id} (demo mode)`);
}

export async function releaseTransaction(transactionId, equipmentId, actingUser) {
  const db = getDb();
  const tx = db.transactions[transactionId];
  if (!tx) throw new Error('Transaction not found.');
  const unit = db.equipment[equipmentId];
  if (!unit) throw new Error('Selected unit not found.');
  if (!['pending', 'approved'].includes(tx.status)) throw new Error('This transaction has already been processed.');
  if (unit.status !== 'available') throw new Error('That unit is no longer available.');
  if (unit.categoryId !== tx.categoryId) throw new Error('That unit does not belong to the requested category.');

  const now = isoNow();
  mutate((db) => {
    db.transactions[transactionId] = {
      ...db.transactions[transactionId], equipmentId, unitCode: unit.unitCode || null,
      status: 'released', releasedBy: actingUser.uid, releasedByName: actingUser.fullName, releasedAt: now,
      decidedBy: tx.decidedBy || actingUser.uid, decidedAt: tx.decidedAt || now,
    };
    db.equipment[equipmentId] = { ...db.equipment[equipmentId], status: 'borrowed', updatedAt: now };
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'release_equipment', `Released ${unit.unitCode || equipmentId} for transaction ${transactionId} (demo mode)`);
}

export async function returnTransaction(transactionId, condition, remarks, actingUser) {
  const db = getDb();
  const tx = db.transactions[transactionId];
  if (!tx) throw new Error('Transaction not found.');
  if (tx.status !== 'released') throw new Error('This transaction is not currently released.');

  const newEquipmentStatus = equipmentStatusForCondition(condition);
  const now = isoNow();
  mutate((db) => {
    db.transactions[transactionId] = {
      ...db.transactions[transactionId], status: 'returned', returnedAt: now, returnCondition: condition,
      receivedBy: actingUser.uid, receivedByName: actingUser.fullName, remarks: remarks || null,
    };
    if (tx.equipmentId && db.equipment[tx.equipmentId]) {
      db.equipment[tx.equipmentId] = { ...db.equipment[tx.equipmentId], status: newEquipmentStatus, updatedAt: now };
    }
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'return_equipment', `Returned ${tx.unitCode || tx.equipmentId} for transaction ${transactionId} (${condition}) (demo mode)`);
}

export async function issueConsumable(transactionId, equipmentId, quantity, actingUser) {
  const db = getDb();
  const tx = db.transactions[transactionId];
  if (!tx) throw new Error('Transaction not found.');
  const item = db.equipment[equipmentId];
  if (!item) throw new Error('Selected item not found.');
  if (tx.status !== 'pending') throw new Error('This request has already been processed.');
  if (item.categoryId !== tx.categoryId) throw new Error('That item does not belong to the requested category.');
  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new Error('Enter a valid quantity to issue.');
  if (qty > item.stockQuantity) throw new Error(`Only ${item.stockQuantity} ${item.unitOfMeasure} left in stock.`);

  const now = isoNow();
  mutate((db) => {
    db.transactions[transactionId] = {
      ...db.transactions[transactionId], equipmentId, quantity: qty, status: 'issued',
      decidedBy: actingUser.uid, decidedAt: now, issuedBy: actingUser.uid, issuedByName: actingUser.fullName, issuedAt: now,
    };
    db.equipment[equipmentId] = { ...db.equipment[equipmentId], stockQuantity: item.stockQuantity - qty, updatedAt: now };
  });
  await logActivity(actingUser.uid, actingUser.fullName, 'issue_consumable', `Issued ${qty} ${item.unitOfMeasure} of "${item.name}" for transaction ${transactionId} (demo mode)`);
}
