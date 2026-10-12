import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { listMyTransactions } from '../../services/transactions.js';
import StatCard from '../../components/StatCard.jsx';
import { TransactionStatusBadge, OverdueBadge } from '../../components/Badges.jsx';
import { labName, isOverdue } from '../../constants.js';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function BorrowerDashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (user) listMyTransactions(user.uid).then(setTransactions);
  }, [user]);

  const active = transactions.filter((t) => ['pending', 'approved', 'released'].includes(t.status)).length;
  const completed = transactions.filter((t) => ['returned', 'issued'].includes(t.status)).length;
  const overdue = transactions.filter(isOverdue).length;

  return (
    <>
      <PageHeader
        title="Borrower Dashboard"
        subtitle="Your requests across all six laboratories, and how each one is progressing."
        icon="bi-speedometer2"
      />
      <div className="row g-3 mb-4">
        <StatCard label="Active Requests" value={active} color="text-primary" icon="bi-hourglass-split" tone="info" />
        <StatCard label="Completed" value={completed} color="text-success" icon="bi-check-circle" tone="success" />
        <StatCard label="Overdue" value={overdue} color="text-danger" icon="bi-alarm" tone="danger" />
        <StatCard label="Total Requests" value={transactions.length} icon="bi-clipboard-data" tone="brand" />
      </div>

      <div className="mb-3">
        <Link to="/borrower/request" className="btn btn-primary"><i className="bi bi-plus-lg"></i> New Request</Link>
      </div>

      <div className="card">
        <PanelHeader icon="bi-clock-history" title="Recent Requests" count={transactions.length} />
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead><tr><th>Lab</th><th>Category</th><th>Unit / Qty</th><th>Status</th><th>Requested</th></tr></thead>
            <tbody>
              {transactions.slice(0, 8).map((t) => (
                <tr key={t.id}>
                  <td>{labName(t.labId)}</td>
                  <td>{t.categoryName}</td>
                  <td>{t.kind === 'durable' ? (t.unitCode || '—') : `${t.quantity ?? '—'} unit(s)`}</td>
                  <td><TransactionStatusBadge status={t.status} /> <OverdueBadge transaction={t} /></td>
                  <td>{new Date(t.requestedAt).toLocaleString()}</td>
                </tr>
              ))}
              {!transactions.length && <EmptyState colSpan={5} icon="bi-inbox" title="No requests yet." />}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
