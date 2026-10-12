import { get, ref, set, update } from 'firebase/database';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { deleteApp } from 'firebase/app';
import { db, firebaseConfigured, getSecondaryAuth } from '../firebase.js';
import { logActivity } from './activityLogs.js';
import * as mock from './mock/users.js';

/** Admin sees everyone; a Lab Custodian only ever queries their own lab's borrowers via other services. */
async function listUsersFirebase(role) {
  const snap = await get(ref(db, 'users'));
  const users = [];
  snap.forEach((child) => {
    const val = child.val();
    if (!role || val.role === role) {
      users.push({ id: child.key, ...val });
    }
  });
  users.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return users;
}

/**
 * Admin creates a pre-approved Lab Custodian/Admin account. `labId` is
 * required when role is 'lab_custodian' and pins that account to one of
 * the six laboratories; ignored otherwise.
 * Uses a secondary Firebase app instance so creating the account doesn't
 * sign the admin out of their own session (createUserWithEmailAndPassword
 * signs in as the new user on whatever app instance it's called on).
 */
async function createStaffAccountFirebase({ fullName, email, role, labId, password }, actingUser) {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  if (role === 'lab_custodian' && !labId) {
    throw new Error('Please select which laboratory this custodian will manage.');
  }
  const { secondaryApp, secondaryAuth } = await getSecondaryAuth();
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await set(ref(db, `users/${cred.user.uid}`), {
      fullName,
      email,
      role,
      labId: role === 'lab_custodian' ? labId : null,
      status: 'approved',
      createdAt: new Date().toISOString(),
    });
    await signOut(secondaryAuth);
    await logActivity(actingUser.uid, actingUser.fullName, 'create_user', `Created ${role} account: ${email}`);
  } finally {
    await deleteApp(secondaryApp);
  }
}

async function setUserStatusFirebase(userId, status, actingUser, reason) {
  await update(ref(db, `users/${userId}`), { status, rejectionReason: status === 'rejected' ? (reason || null) : null });
  await logActivity(actingUser.uid, actingUser.fullName, 'update_user_status', `User ${userId} set to ${status}${reason ? ` (${reason})` : ''}`);
}

export const listUsers = firebaseConfigured ? listUsersFirebase : mock.listUsers;
export const createStaffAccount = firebaseConfigured ? createStaffAccountFirebase : mock.createStaffAccount;
export const setUserStatus = firebaseConfigured ? setUserStatusFirebase : mock.setUserStatus;
