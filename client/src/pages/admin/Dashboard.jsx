import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { listUsers } from '../../services/users.js';
import { listEquipment } from '../../services/equipment.js';
import { listActivityLogs } from '../../services/activityLogs.js';
import StatCard from '../../components/StatCard.jsx';
import CompositionBar, { CompositionLegend } from '../../components/CompositionBar.jsx';
import ActivityFeed from '../../components/ActivityFeed.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { LABS, labIcon, expiryState, isLowStock } from '../../constants.js';
import { greeting } from '../../utils/time.js';

function SectionLabel({ children, action }) {
  return (
    <div className="d-flex align-items-baseline justify-content-between">
      <div className="section-label">{children}</div>
      {action}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    listUsers().then(setUsers);
    listEquipment().then(setEquipment);
    listActivityLogs().then((l) => setLogs(l.slice(0, 8)));
  }, []);

  const counts = users.reduce((acc, u) => {
    if (u.status === 'approved') acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  const pendingUsers = users.filter((u) => u.status === 'pending').length;
  const borrowedNow = equipment.filter((e) => e.status === 'borrowed').length;
  const expiringOrExpired = equipment.filter((e) => expiryState(e.expirationDate)).length;
  const expiredOnly = equipment.filter((e) => expiryState(e.expirationDate) === 'expired').length;
  const lowStockCount = equipment.filter(isLowStock).length;
  const labsWithoutCustodian = LABS.filter(
    (lab) => !users.some((u) => u.role === 'lab_custodian' && u.labId === lab.id && u.status === 'approved')
  );

  // Per-lab rows, largest first — `max` scales every bar to the biggest lab so
  // the column is comparable top to bottom.
  const labRows = LABS.map((lab) => {
    const items = equipment.filter((e) => e.labId === lab.id);
    return {
      ...lab,
      total: items.length,
      durable: items.filter((e) => e.itemType === 'durable').length,
      consumable: items.filter((e) => e.itemType === 'consumable').length,
      flagged: items.filter((e) => expiryState(e.expirationDate) || isLowStock(e)).length,
    };
  }).sort((a, b) => b.total - a.total);

  const maxLabTotal = Math.max(...labRows.map((l) => l.total), 0);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <>
      <div className="hero-panel">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <h1 className="hero-greeting">
              {greeting()}{user?.fullName ? `, ${user.fullName.split(/\s+/)[0]}` : ''}.
            </h1>
            <p className="hero-meta">{today} · College of Arts and Sciences, Samar State University</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {pendingUsers > 0 ? (
              <Link to="/admin/users?status=pending" className="hero-pill is-alert">
                <span className="hero-pill-dot" />
                {pendingUsers} awaiting approval
              </Link>
            ) : (
              <span className="hero-pill">
                <i className="bi bi-check-circle"></i> All registrations reviewed
              </span>
            )}
            {expiredOnly > 0 && (
              <Link to="/admin/inventory?flag=expiring" className="hero-pill is-alert">
                <span className="hero-pill-dot" />
                {expiredOnly} expired item{expiredOnly === 1 ? '' : 's'}
              </Link>
            )}
            {lowStockCount > 0 && (
              <Link to="/admin/inventory?flag=lowStock" className="hero-pill is-alert">
                <span className="hero-pill-dot" />
                {lowStockCount} low on stock
              </Link>
            )}
            <span className="hero-pill">
              <i className="bi bi-buildings"></i> {LABS.length} laboratories
            </span>
          </div>
        </div>
      </div>

      {labsWithoutCustodian.length > 0 && (
        <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>
            <i className="bi bi-exclamation-triangle-fill me-1"></i>
            <strong>{labsWithoutCustodian.length}</strong>{' '}
            laborator{labsWithoutCustodian.length === 1 ? 'y has' : 'ies have'} no approved custodian:{' '}
            {labsWithoutCustodian.map((l) => l.name.replace(' Laboratory', '')).join(', ')}.
          </span>
          <Link to="/admin/users" className="btn btn-sm btn-outline-secondary">Assign custodian</Link>
        </div>
      )}

      <SectionLabel action={<Link to="/admin/users" className="small">Manage users &rarr;</Link>}>Accounts</SectionLabel>
      <div className="row g-3 mb-4">
        <StatCard
          label="Lab Custodians" value={counts.lab_custodian || 0} icon="bi-person-badge"
          to="/admin/users?role=lab_custodian" colClass="col-md-4" tone="brand"
          hint={`across ${LABS.length} laboratories`}
        />
        <StatCard
          label="Borrowers" value={counts.borrower || 0} icon="bi-people"
          to="/admin/users?role=borrower" colClass="col-md-4" tone="info"
          hint="approved and able to log in"
        />
        <StatCard
          label="Pending Registrations" value={pendingUsers} color={pendingUsers ? 'text-warning' : ''}
          icon="bi-hourglass-split" to="/admin/users?status=pending" colClass="col-md-4" tone="warning"
          hint={pendingUsers ? 'waiting on your review' : 'nothing to review'}
        />
      </div>

      <SectionLabel action={<Link to="/admin/inventory" className="small">Full inventory &rarr;</Link>}>Inventory</SectionLabel>
      <div className="row g-3 mb-4">
        <StatCard
          label="Total Registered Items" value={equipment.length} icon="bi-boxes"
          to="/admin/inventory" colClass="col-md-3" tone="brand" hint="all laboratories"
        />
        <StatCard
          label="Currently Borrowed" value={borrowedNow} icon="bi-arrow-left-right"
          to="/admin/inventory?flag=borrowed" colClass="col-md-3" tone="info"
          hint={equipment.length ? `${Math.round((borrowedNow / equipment.length) * 100)}% of inventory` : '—'}
        />
        <StatCard
          label="Expiring / Expired" value={expiringOrExpired} color={expiringOrExpired ? 'text-danger' : ''}
          icon="bi-exclamation-triangle" to="/admin/inventory?flag=expiring" colClass="col-md-3" tone="danger"
          hint={expiredOnly ? `${expiredOnly} already expired` : 'within 30 days'}
        />
        <StatCard
          label="Low Stock Items" value={lowStockCount} color={lowStockCount ? 'text-warning' : ''}
          icon="bi-graph-down-arrow" to="/admin/inventory?flag=lowStock" colClass="col-md-3" tone="warning"
          hint={lowStockCount ? 'at or below reorder level' : 'stock levels healthy'}
        />
      </div>

      <div className="row g-3">
        <div className="col-xl-7">
          <div className="card h-100">
            <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span>Laboratories by Inventory</span>
              <CompositionLegend />
            </div>
            <div className="table-responsive">
              <table className="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Laboratory</th>
                    <th style={{ minWidth: 130 }}>Composition</th>
                    <th className="text-end">Durable</th>
                    <th className="text-end">Consum.</th>
                    <th className="text-end">Total</th>
                    <th className="text-end">Flagged</th>
                  </tr>
                </thead>
                <tbody>
                  {labRows.map((lab) => (
                    <tr key={lab.id}>
                      <td>
                        <Link to={`/admin/inventory?lab=${lab.id}`} className="d-flex align-items-center gap-2 text-decoration-none">
                          <span className="stat-icon mb-0" style={{ width: 30, height: 30, fontSize: '0.85rem' }}>
                            <i className={`bi ${labIcon(lab.id)}`}></i>
                          </span>
                          <span className="fw-medium text-body">{lab.name.replace(' Laboratory', '')}</span>
                        </Link>
                      </td>
                      <td>
                        <CompositionBar durable={lab.durable} consumable={lab.consumable} max={maxLabTotal} />
                      </td>
                      <td className="text-end" style={{ color: 'var(--series-durable)', fontWeight: 600 }}>{lab.durable}</td>
                      <td className="text-end" style={{ color: 'var(--series-consumable)', fontWeight: 600 }}>{lab.consumable}</td>
                      <td className="text-end fw-bold">{lab.total}</td>
                      <td className="text-end">
                        {lab.flagged > 0
                          ? <span className="badge soft-danger"><i className="bi bi-exclamation-triangle"></i> {lab.flagged}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                  {!equipment.length && <EmptyState colSpan={6} icon="bi-boxes" title="No inventory registered yet." />}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Recent Activity</span>
              <Link to="/admin/activity-logs" className="small">View all &rarr;</Link>
            </div>
            {logs.length ? (
              <ActivityFeed logs={logs} />
            ) : (
              <EmptyState icon="bi-clock-history" title="No activity yet." text="Actions will appear here as staff use the system." />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
