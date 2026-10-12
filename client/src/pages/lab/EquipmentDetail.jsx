import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEquipmentDetail } from '../../services/equipment.js';
import { EquipmentStatusBadge, TransactionStatusBadge, ExpiryBadge } from '../../components/Badges.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

function fmtDt(dt) { return dt ? new Date(dt).toLocaleString() : '—'; }
function fmtD(d) { return d ? new Date(d).toLocaleDateString() : '—'; }

export default function LabEquipmentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => { getEquipmentDetail(id).then(setData); }, [id]);

  if (!data) return <div className="text-muted">Loading…</div>;
  const { equipment, transactions, maintenance } = data;
  const isDurable = equipment.itemType === 'durable';

  return (
    <>
      <Link to="/lab/equipment" className="small d-inline-flex align-items-center gap-1 mb-3 no-print">
        <i className="bi bi-arrow-left"></i> Back to Equipment
      </Link>

      <PageHeader
        title={isDurable ? `${equipment.unitCode} · ${equipment.name}` : equipment.name}
        icon={isDurable ? 'bi-upc-scan' : 'bi-droplet-half'}
      >
        <div className="d-flex align-items-center flex-wrap gap-2 mt-2 text-muted" style={{ fontSize: '0.85rem' }}>
          <span>{equipment.categoryName}</span>
          {isDurable
            ? <EquipmentStatusBadge status={equipment.status} />
            : <span className="badge soft-info">{equipment.stockQuantity} {equipment.unitOfMeasure} in stock</span>}
          <ExpiryBadge expirationDate={equipment.expirationDate} />
          <span>· Acquired {fmtD(equipment.dateAcquired)}</span>
        </div>
      </PageHeader>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card">
            <PanelHeader
              icon={isDurable ? 'bi-clock-history' : 'bi-droplet-half'}
              title={isDurable ? 'Borrowing History' : 'Issuance History'}
              count={transactions.length}
            />
            <div className="table-responsive">
              {isDurable ? (
                <table className="table table-sm mb-0">
                  <thead><tr><th>Borrower</th><th>Released</th><th>Returned</th><th>Condition</th><th>Status</th></tr></thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{t.borrowerName}</td>
                        <td>{fmtDt(t.releasedAt)}</td>
                        <td>{fmtDt(t.returnedAt)}</td>
                        <td>{t.returnCondition || '—'}</td>
                        <td><TransactionStatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                    {!transactions.length && <EmptyState colSpan={5} icon="bi-clock-history" title="No borrowing history." />}
                  </tbody>
                </table>
              ) : (
                <table className="table table-sm mb-0">
                  <thead><tr><th>Borrower</th><th>Quantity</th><th>Issued</th><th>Status</th></tr></thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{t.borrowerName}</td>
                        <td>{t.quantity} {equipment.unitOfMeasure}</td>
                        <td>{fmtDt(t.issuedAt)}</td>
                        <td><TransactionStatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                    {!transactions.length && <EmptyState colSpan={4} icon="bi-clock-history" title="No issuance history." />}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        {isDurable && (
          <div className="col-md-6">
            <div className="card">
              <PanelHeader icon="bi-tools" tone="warning" title="Maintenance History" count={maintenance.length} />
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead><tr><th>Date</th><th>Problem</th><th>Action</th><th>Result</th></tr></thead>
                  <tbody>
                    {maintenance.map((m) => (
                      <tr key={m.id}>
                        <td>{fmtD(m.dateReported)}</td>
                        <td>{m.problem}</td>
                        <td>{m.actionTaken}</td>
                        <td><EquipmentStatusBadge status={m.resultingStatus} /></td>
                      </tr>
                    ))}
                    {!maintenance.length && <EmptyState colSpan={4} icon="bi-tools" title="No maintenance history." />}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
