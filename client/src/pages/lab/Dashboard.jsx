import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { listEquipment } from '../../services/equipment.js';
import { listMaintenance } from '../../services/maintenance.js';
import { listAllTransactions } from '../../services/transactions.js';
import { labName, expiryState, isOverdue, isLowStock } from '../../constants.js';
import StatCard from '../../components/StatCard.jsx';
import { EquipmentStatusBadge, TransactionStatusBadge, ExpiryBadge, LowStockBadge } from '../../components/Badges.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function LabDashboard() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user) return;
    listEquipment(user.labId).then(setEquipment);
    listMaintenance(user.labId).then((m) => setMaintenance(m.slice(0, 5)));
    listAllTransactions(user.labId).then(setTransactions);
  }, [user]);

  const durable = equipment.filter((e) => e.itemType === 'durable');
  const consumable = equipment.filter((e) => e.itemType === 'consumable');
  const available = durable.filter((e) => e.status === 'available').length;
  const borrowed = durable.filter((e) => e.status === 'borrowed').length;
  const flagged = equipment.filter((e) => expiryState(e.expirationDate)).length;
  const lowStockItems = consumable.filter(isLowStock);
  const lowStock = lowStockItems.length;
  const overdue = transactions.filter(isOverdue);

  return (
    <>
      <PageHeader
        title={`${labName(user?.labId)} Dashboard`}
        subtitle="Everything below is scoped to your laboratory only."
        icon="bi-speedometer2"
      />

      <div className="section-label">Durable Equipment</div>
      <div className="row g-3 mb-4">
        <StatCard label="Total Units" value={durable.length} icon="bi-box-seam" colClass="col-md-4" tone="brand" />
        <StatCard label="Available Now" value={available} color="text-success" icon="bi-check-circle" colClass="col-md-4" tone="success" />
        <StatCard label="Currently Borrowed" value={borrowed} color="text-primary" icon="bi-arrow-left-right" colClass="col-md-4" tone="info" />
      </div>

      <div className="section-label">Supplies &amp; Attention Needed</div>
      <div className="row g-3 mb-4">
        <StatCard label="Consumable Items Tracked" value={consumable.length} icon="bi-droplet-half" colClass="col-md-3" tone="info" />
        <StatCard label="Low Stock Items" value={lowStock} color="text-warning" icon="bi-graph-down-arrow" colClass="col-md-3" tone="warning" />
        <StatCard label="Overdue Returns" value={overdue.length} color="text-danger" icon="bi-alarm" colClass="col-md-3" tone="danger" />
        <StatCard label="Expiring / Expired Items" value={flagged} color="text-danger" icon="bi-exclamation-triangle" colClass="col-md-3" tone="danger" />
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card">
            <PanelHeader icon="bi-tools" title="Recent Maintenance Entries" />
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead><tr><th>Unit</th><th>Problem</th><th>Status</th></tr></thead>
                <tbody>
                  {maintenance.map((m) => (
                    <tr key={m.id}>
                      <td>{m.unitCode}</td>
                      <td>{m.problem}</td>
                      <td><EquipmentStatusBadge status={m.resultingStatus} /></td>
                    </tr>
                  ))}
                  {!maintenance.length && <EmptyState colSpan={3} icon="bi-tools" title="No maintenance records yet." />}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <PanelHeader icon="bi-inbox" title="Recent Requests" />
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead><tr><th>Borrower</th><th>Item</th><th>Status</th></tr></thead>
                <tbody>
                  {transactions.slice(0, 6).map((t) => (
                    <tr key={t.id}>
                      <td>{t.borrowerName}</td>
                      <td>{t.categoryName}</td>
                      <td><TransactionStatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                  {!transactions.length && <EmptyState colSpan={3} icon="bi-inbox" title="No requests yet." />}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="card mt-3">
          <PanelHeader
            icon="bi-alarm" tone="danger" title="Overdue Returns" count={overdue.length}
            action={<Link to="/lab/return" className="small">Go to Return &rarr;</Link>}
          />
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead><tr><th>Borrower</th><th>Unit</th><th>Was Due</th></tr></thead>
              <tbody>
                {overdue.map((t) => (
                  <tr key={t.id}>
                    <td>{t.borrowerName}</td>
                    <td>{t.unitCode}</td>
                    <td className="text-danger">{new Date(t.expectedReturn).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lowStock > 0 && (
        <div className="card mt-3">
          <PanelHeader
            icon="bi-graph-down-arrow" tone="warning" title="Needs Restock" count={lowStock}
            action={<Link to="/lab/equipment" className="small">Go to Equipment &rarr;</Link>}
          />
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead><tr><th>Item</th><th>Stock</th><th>Status</th></tr></thead>
              <tbody>
                {lowStockItems.map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.stockQuantity} <span className="text-muted small">{e.unitOfMeasure}</span></td>
                    <td><LowStockBadge item={e} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {flagged > 0 && (
        <div className="card mt-3">
          <PanelHeader
            icon="bi-exclamation-triangle" tone="danger"
            title="Items Needing Attention (Expired / Expiring Soon)" count={flagged}
          />
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead><tr><th>Item</th><th>Type</th><th>Expiry</th></tr></thead>
              <tbody>
                {equipment.filter((e) => expiryState(e.expirationDate)).map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td className="text-capitalize">{e.itemType}</td>
                    <td><ExpiryBadge expirationDate={e.expirationDate} /> <span className="text-muted small">{new Date(e.expirationDate).toLocaleDateString()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
