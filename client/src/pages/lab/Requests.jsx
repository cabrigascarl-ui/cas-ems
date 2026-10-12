import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { listAllTransactions, decideTransaction, issueConsumable } from '../../services/transactions.js';
import { findConsumablesByCategory } from '../../services/equipment.js';
import { errorMessage } from '../../utils/errors.js';
import { TransactionStatusBadge } from '../../components/Badges.jsx';
import Pagination, { usePagination } from '../../components/Pagination.jsx';
import Alert from '../../components/Alert.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function LabRequests() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [issuing, setIssuing] = useState(null);
  const [stockOptions, setStockOptions] = useState([]);
  const [issueEquipmentId, setIssueEquipmentId] = useState('');
  const [issueQty, setIssueQty] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function load() {
    if (user) listAllTransactions(user.labId).then(setTransactions);
  }

  useEffect(() => { load(); }, [user]);

  async function approve(id) {
    await decideTransaction(id, 'approved', user);
    load();
  }

  function openReject(t) {
    setRejecting(t);
    setRejectReason('');
    setTimeout(() => window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('rejectModal')).show(), 0);
  }

  async function confirmReject(e) {
    e.preventDefault();
    await decideTransaction(rejecting.id, 'rejected', user, rejectReason.trim());
    setRejecting(null);
    load();
    window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('rejectModal')).hide();
  }

  function openIssue(t) {
    setIssuing(t);
    setIssueQty(t.quantity || '');
    setError('');
    findConsumablesByCategory(t.categoryId).then((opts) => {
      setStockOptions(opts);
      setIssueEquipmentId(opts[0]?.id || '');
    });
    setTimeout(() => window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('issueModal')).show(), 0);
  }

  async function handleIssue(e) {
    e.preventDefault();
    setError('');
    try {
      await issueConsumable(issuing.id, issueEquipmentId, issueQty, user);
      setSuccess(`Issued ${issueQty} unit(s) to ${issuing.borrowerName}.`);
      setIssuing(null);
      load();
      window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('issueModal')).hide();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const pendingDurable = transactions.filter((t) => t.kind === 'durable' && t.status === 'pending');
  const pendingConsumable = transactions.filter((t) => t.kind === 'consumable' && t.status === 'pending');
  const approvedDurable = transactions.filter((t) => t.kind === 'durable' && t.status === 'approved');

  const durablePaged = usePagination(pendingDurable);
  const consumablePaged = usePagination(pendingConsumable);
  const approvedPaged = usePagination(approvedDurable);

  return (
    <>
      <PageHeader
        title="Requests"
        subtitle="Incoming borrow and supply requests for your laboratory, awaiting your decision."
        icon="bi-inbox"
      />
      <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>

      <div className="row g-3 mb-4">
        <StatCard label="Pending Durable" value={pendingDurable.length} icon="bi-box-seam" colClass="col-md-4" tone="warning" />
        <StatCard label="Pending Consumables" value={pendingConsumable.length} icon="bi-droplet-half" colClass="col-md-4" tone="info" />
        <StatCard label="Awaiting Release" value={approvedDurable.length} icon="bi-box-arrow-up" colClass="col-md-4" tone="brand" />
      </div>

      <div className="card mb-4">
        <PanelHeader icon="bi-box-seam" title="Durable Equipment — Pending Decision" count={pendingDurable.length} />
        <div className="table-responsive">
          <table className="table table-sm mb-0 align-middle">
            <thead><tr><th>Borrower</th><th>Category</th><th>Purpose</th><th>Expected Return</th><th>Requested</th><th></th></tr></thead>
            <tbody>
              {durablePaged.pageItems.map((t) => (
                <tr key={t.id}>
                  <td>{t.borrowerName}</td>
                  <td>{t.categoryName}</td>
                  <td>{t.purpose || '—'}</td>
                  <td>{t.expectedReturn ? new Date(t.expectedReturn).toLocaleDateString() : '—'}</td>
                  <td>{new Date(t.requestedAt).toLocaleString()}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-success me-1" onClick={() => approve(t.id)}>Approve</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => openReject(t)}>Reject</button>
                  </td>
                </tr>
              ))}
              {!durablePaged.pageItems.length && <EmptyState colSpan={6} icon="bi-box-seam" title="No pending durable requests." />}
            </tbody>
          </table>
        </div>
        <Pagination page={durablePaged.page} pageCount={durablePaged.pageCount} onChange={durablePaged.setPage} />
      </div>

      <div className="card mb-4">
        <PanelHeader icon="bi-droplet-half" tone="info" title="Consumables — Pending Issuance" count={pendingConsumable.length} />
        <div className="table-responsive">
          <table className="table table-sm mb-0 align-middle">
            <thead><tr><th>Borrower</th><th>Category</th><th>Quantity</th><th>Purpose</th><th>Requested</th><th></th></tr></thead>
            <tbody>
              {consumablePaged.pageItems.map((t) => (
                <tr key={t.id}>
                  <td>{t.borrowerName}</td>
                  <td>{t.categoryName}</td>
                  <td>{t.quantity}</td>
                  <td>{t.purpose || '—'}</td>
                  <td>{new Date(t.requestedAt).toLocaleString()}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-success me-1" onClick={() => openIssue(t)}>Approve &amp; Issue</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => openReject(t)}>Reject</button>
                  </td>
                </tr>
              ))}
              {!consumablePaged.pageItems.length && <EmptyState colSpan={6} icon="bi-droplet-half" title="No pending consumable requests." />}
            </tbody>
          </table>
        </div>
        <Pagination page={consumablePaged.page} pageCount={consumablePaged.pageCount} onChange={consumablePaged.setPage} />
      </div>

      <div className="card">
        <PanelHeader
          icon="bi-box-arrow-up" title="Approved &middot; Awaiting Release" count={approvedDurable.length}
          action={<Link to="/lab/release" className="small">Go to Release &rarr;</Link>}
        />
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead><tr><th>Borrower</th><th>Category</th><th>Status</th></tr></thead>
            <tbody>
              {approvedPaged.pageItems.map((t) => (
                <tr key={t.id}>
                  <td>{t.borrowerName}</td>
                  <td>{t.categoryName}</td>
                  <td><TransactionStatusBadge status={t.status} /></td>
                </tr>
              ))}
              {!approvedPaged.pageItems.length && <EmptyState colSpan={3} icon="bi-inbox" title="None awaiting release." />}
            </tbody>
          </table>
        </div>
        <Pagination page={approvedPaged.page} pageCount={approvedPaged.pageCount} onChange={approvedPaged.setPage} />
      </div>

      <div className="modal fade" id="issueModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleIssue}>
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <span className="panel-icon tone-success"><i className="bi bi-box-arrow-up"></i></span>
                  Issue to {issuing?.borrowerName}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body">
                <Alert onClose={() => setError('')}>{error}</Alert>
                <p className="text-muted small">Requested: {issuing?.quantity} unit(s) of {issuing?.categoryName}.</p>
                <div className="mb-3">
                  <label className="form-label">Stock Entry</label>
                  <select className="form-select" value={issueEquipmentId} onChange={(e) => setIssueEquipmentId(e.target.value)} required>
                    <option value="">Select item</option>
                    {stockOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.name} — {o.stockQuantity} {o.unitOfMeasure} available</option>
                    ))}
                  </select>
                  {!stockOptions.length && <p className="small text-danger mt-1">No in-stock, non-expired items in this category.</p>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Quantity to Issue</label>
                  <input type="number" min="1" className="form-control" value={issueQty} onChange={(e) => setIssueQty(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={!stockOptions.length}>Confirm Issue</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal fade" id="rejectModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={confirmReject}>
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <span className="panel-icon tone-danger"><i className="bi bi-x-circle"></i></span>
                  Reject Request — {rejecting?.borrowerName}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Reason (shown to the borrower)</label>
                  <textarea className="form-control" rows="3" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. No units currently available in this category" required></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-danger">Reject Request</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
