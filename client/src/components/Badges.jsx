import { expiryState, isOverdue, stockState } from '../constants.js';

const EQUIPMENT_STATUS_STYLE = {
  available: 'soft-success',
  borrowed: 'soft-primary',
  under_maintenance: 'soft-warning',
  unserviceable: 'soft-neutral',
};

const TRANSACTION_STATUS_STYLE = {
  pending: 'soft-warning',
  approved: 'soft-info',
  rejected: 'soft-danger',
  released: 'soft-primary',
  returned: 'soft-success',
  issued: 'soft-success',
  cancelled: 'soft-neutral',
};

const USER_STATUS_STYLE = {
  pending: 'soft-warning',
  approved: 'soft-success',
  rejected: 'soft-danger',
};

function Badge({ style, text }) {
  return <span className={`badge ${style}`}>{text.replace(/_/g, ' ')}</span>;
}

export function EquipmentStatusBadge({ status }) {
  return <Badge style={EQUIPMENT_STATUS_STYLE[status] || 'soft-neutral'} text={status} />;
}

export function TransactionStatusBadge({ status }) {
  return <Badge style={TRANSACTION_STATUS_STYLE[status] || 'soft-neutral'} text={status} />;
}

export function UserStatusBadge({ status }) {
  return <Badge style={USER_STATUS_STYLE[status] || 'soft-neutral'} text={status} />;
}

/** Renders nothing if the item has no expiration date or isn't expired/expiring soon. */
export function ExpiryBadge({ expirationDate }) {
  const state = expiryState(expirationDate);
  if (!state) return null;
  if (state === 'expired') return <span className="badge soft-danger"><i className="bi bi-exclamation-triangle"></i> expired</span>;
  return <span className="badge soft-warning"><i className="bi bi-hourglass-split"></i> expiring soon</span>;
}

/** Renders nothing unless the consumable is at/below its reorder threshold. */
export function LowStockBadge({ item }) {
  const state = stockState(item);
  if (!state) return null;
  if (state === 'out') return <span className="badge soft-danger"><i className="bi bi-x-circle"></i> out of stock</span>;
  return <span className="badge soft-warning"><i className="bi bi-graph-down-arrow"></i> low stock</span>;
}

/** Renders nothing unless the transaction is released and past its expected return date. */
export function OverdueBadge({ transaction }) {
  if (!isOverdue(transaction)) return null;
  return <span className="badge soft-danger"><i className="bi bi-alarm"></i> overdue</span>;
}
