import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { listMyTransactions, cancelTransaction } from '../../services/transactions.js';
import { TransactionStatusBadge, OverdueBadge } from '../../components/Badges.jsx';
import Pagination, { usePagination } from '../../components/Pagination.jsx';
import { labName } from '../../constants.js';
import { errorMessage } from '../../utils/errors.js';
import Alert from '../../components/Alert.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

function fmtDt(dt) { return dt ? new Date(dt).toLocaleString() : '—'; }

export default function BorrowerHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  function load() {
    if (user) listMyTransactions(user.uid).then(setTransactions);
  }

  useEffect(() => { load(); }, [user]);

  async function handleCancel(id) {
    setError('');
    try {
      await cancelTransaction(id, user);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const { page, pageCount, setPage, pageItems } = usePagination(transactions);

  return (
    <>
      <PageHeader
        title="My Transactions"
        subtitle="Every request you've made, from submission through release and return."
        icon="bi-clock-history"
      />
      <Alert onClose={() => setError('')}>{error}</Alert>
      <div className="card">
        <PanelHeader icon="bi-arrow-left-right" title="All Transactions" count={transactions.length} />
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead><tr><th>Lab</th><th>Kind</th><th>Category</th><th>Unit / Qty</th><th>Status</th><th>Requested</th><th>Released / Issued</th><th>Returned</th><th>Condition</th><th></th></tr></thead>
            <tbody>
              {pageItems.map((t) => (
                <tr key={t.id}>
                  <td>{labName(t.labId)}</td>
                  <td className="text-capitalize">{t.kind}</td>
                  <td>{t.categoryName}</td>
                  <td>{t.kind === 'durable' ? (t.unitCode || '—') : `${t.quantity ?? '—'} unit(s)`}</td>
                  <td>
                    <TransactionStatusBadge status={t.status} /> <OverdueBadge transaction={t} />
                    {t.status === 'rejected' && t.rejectionReason && (
                      <div className="small text-muted mt-1">Reason: {t.rejectionReason}</div>
                    )}
                  </td>
                  <td>{fmtDt(t.requestedAt)}</td>
                  <td>{fmtDt(t.releasedAt || t.issuedAt)}</td>
                  <td>{fmtDt(t.returnedAt)}</td>
                  <td>{t.returnCondition || '—'}</td>
                  <td className="text-end">
                    {t.status === 'pending' && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(t.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
              {!pageItems.length && <EmptyState colSpan={10} icon="bi-arrow-left-right" title="No transactions yet." />}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </div>
    </>
  );
}
