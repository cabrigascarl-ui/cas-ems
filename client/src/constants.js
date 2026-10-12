export const ROLES = [
  { id: 'admin', label: 'System Administrator' },
  { id: 'lab_custodian', label: 'Laboratory Custodian' },
  { id: 'borrower', label: 'Borrower' },
];

export function roleLabel(role) {
  return ROLES.find((r) => r.id === role)?.label || role;
}

export const LABS = [
  { id: 'it', name: 'IT Laboratory' },
  { id: 'statistics', name: 'Statistics Laboratory' },
  { id: 'mathematics', name: 'Mathematics Laboratory' },
  { id: 'psychology', name: 'Psychology Laboratory' },
  { id: 'physics', name: 'Physics Laboratory' },
  { id: 'chemistry', name: 'Chemistry Laboratory' },
];

export function labName(labId) {
  return LABS.find((l) => l.id === labId)?.name || labId || 'Unassigned';
}

export const LAB_ICONS = {
  it: 'bi-laptop',
  statistics: 'bi-bar-chart',
  mathematics: 'bi-calculator',
  psychology: 'bi-emoji-smile',
  physics: 'bi-magnet',
  chemistry: 'bi-droplet-half',
};

export function labIcon(labId) {
  return LAB_ICONS[labId] || 'bi-building';
}

export const ITEM_TYPES = [
  { id: 'durable', label: 'Durable Equipment' },
  { id: 'consumable', label: 'Consumable / One-time Use' },
];

export const EQUIPMENT_STATUSES = ['available', 'borrowed', 'under_maintenance', 'unserviceable'];

export const RETURN_CONDITIONS = ['good', 'needs_repair', 'damaged', 'lost'];

export function returnConditionLabel(condition) {
  return {
    good: 'Good',
    needs_repair: 'Needs Repair',
    damaged: 'Damaged',
    lost: 'Lost (not returned)',
  }[condition] || condition;
}

export const EXPIRY_WARNING_DAYS = 30;

/** 'expired' | 'expiring' | null (no expiry set, or far enough out to not flag) */
export function expiryState(expirationDate) {
  if (!expirationDate) return null;
  const now = new Date();
  const exp = new Date(expirationDate);
  const diffDays = Math.floor((exp - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= EXPIRY_WARNING_DAYS) return 'expiring';
  return null;
}

/** 'out' | 'low' | null (no threshold set, or comfortably above it) */
export function stockState(item) {
  if (!item || item.itemType !== 'consumable' || item.reorderThreshold == null) return null;
  if (item.stockQuantity <= 0) return 'out';
  if (item.stockQuantity <= item.reorderThreshold) return 'low';
  return null;
}

/** True for a consumable at or below its reorder threshold (no threshold set means never flagged). */
export function isLowStock(item) {
  return stockState(item) != null;
}

/** True for a durable transaction that's still out past its expected return date. */
export function isOverdue(tx) {
  if (!tx || tx.status !== 'released' || !tx.expectedReturn) return false;
  return new Date(tx.expectedReturn) < new Date(new Date().toDateString());
}

export const PAGE_SIZE = 10;

export function accountStatusMessage(profile) {
  if (profile.status === 'pending') {
    return 'Your account is pending approval by the Administrator.';
  }
  if (profile.status === 'rejected') {
    return `Your account registration was rejected.${profile.rejectionReason ? ` Reason: ${profile.rejectionReason}` : ''}`;
  }
  return `Your account is ${profile.status}.`;
}

/**
 * Presentation metadata for the activity-log action codes written by the
 * services. `tone` maps onto the badge/soft- colour set, not the categorical
 * chart palette — these are states, not series.
 */
export const ACTIVITY_ACTIONS = {
  login:                   { label: 'Signed in',            icon: 'bi-box-arrow-in-right', tone: 'neutral' },
  logout:                  { label: 'Signed out',           icon: 'bi-box-arrow-right',    tone: 'neutral' },
  register:                { label: 'Registered',           icon: 'bi-person-plus',        tone: 'info' },
  create_user:             { label: 'Account created',      icon: 'bi-person-badge',       tone: 'primary' },
  update_user_status:      { label: 'Account reviewed',     icon: 'bi-shield-check',       tone: 'primary' },
  register_equipment:      { label: 'Item registered',      icon: 'bi-plus-square',        tone: 'primary' },
  update_equipment_status: { label: 'Status changed',       icon: 'bi-arrow-repeat',       tone: 'warning' },
  restock_consumable:      { label: 'Restocked',            icon: 'bi-arrow-up-circle',    tone: 'success' },
  issue_consumable:        { label: 'Supplies issued',      icon: 'bi-droplet-half',       tone: 'info' },
  borrow_decision:         { label: 'Request decided',      icon: 'bi-check2-square',      tone: 'primary' },
  release_equipment:       { label: 'Equipment released',   icon: 'bi-box-arrow-up',       tone: 'info' },
  return_equipment:        { label: 'Equipment returned',   icon: 'bi-box-arrow-in-down',  tone: 'success' },
  cancel_request:          { label: 'Request cancelled',    icon: 'bi-x-circle',           tone: 'danger' },
  log_maintenance:         { label: 'Maintenance logged',   icon: 'bi-tools',              tone: 'warning' },
};

export function actionMeta(action) {
  return ACTIVITY_ACTIONS[action] || {
    label: (action || 'Activity').replace(/_/g, ' '),
    icon: 'bi-dot',
    tone: 'neutral',
  };
}

export const ROLE_HOME = {
  admin: '/admin/dashboard',
  lab_custodian: '/lab/dashboard',
  borrower: '/borrower/dashboard',
};

export function roleHome(role) {
  return ROLE_HOME[role] || '/login';
}
