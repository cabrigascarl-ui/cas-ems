import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listUsers } from '../../services/users.js';
import { listEquipment } from '../../services/equipment.js';
import { LABS, labIcon, expiryState } from '../../constants.js';
import PageHeader from '../../components/PageHeader.jsx';
import CompositionBar, { CompositionLegend } from '../../components/CompositionBar.jsx';

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
}

function Metric({ value, label, color }) {
  return (
    <div className="lab-metric">
      <div className={`lab-metric-value ${color || ''}`}>{value}</div>
      <div className="lab-metric-label">{label}</div>
    </div>
  );
}

export default function AdminLaboratories() {
  const [custodians, setCustodians] = useState([]);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    listUsers('lab_custodian').then(setCustodians);
    listEquipment().then(setEquipment);
  }, []);

  const labs = LABS.map((lab) => {
    const items = equipment.filter((e) => e.labId === lab.id);
    const durable = items.filter((e) => e.itemType === 'durable');
    return {
      ...lab,
      staff: custodians.filter((c) => c.labId === lab.id),
      total: items.length,
      durable: durable.length,
      consumable: items.filter((e) => e.itemType === 'consumable').length,
      borrowed: durable.filter((e) => e.status === 'borrowed').length,
      flagged: items.filter((e) => expiryState(e.expirationDate)).length,
    };
  });

  // Bars are comparable across cards, so scale them all to the largest lab.
  const maxTotal = Math.max(...labs.map((l) => l.total), 0);
  const unstaffed = labs.filter((l) => !l.staff.some((c) => c.status === 'approved')).length;

  return (
    <>
      <PageHeader
        title="Laboratories"
        subtitle="All six laboratories, their assigned custodian, and inventory at a glance."
        icon="bi-buildings"
        actions={<CompositionLegend />}
      />

      {unstaffed > 0 && (
        <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>
            <i className="bi bi-exclamation-triangle-fill me-1"></i>
            <strong>{unstaffed}</strong> laborator{unstaffed === 1 ? 'y is' : 'ies are'} without an approved custodian.
            Requests for {unstaffed === 1 ? 'it' : 'them'} cannot be processed.
          </span>
          <Link to="/admin/users" className="btn btn-sm btn-outline-secondary">Create custodian account</Link>
        </div>
      )}

      <div className="row g-3">
        {labs.map((lab) => {
          const approved = lab.staff.filter((c) => c.status === 'approved');
          return (
            <div className="col-xl-6" key={lab.id}>
              <div className="card lab-card h-100">
                <div className="lab-head">
                  <div className="d-flex align-items-center gap-2">
                    <span className="stat-icon mb-0">
                      <i className={`bi ${labIcon(lab.id)}`}></i>
                    </span>
                    <div className="d-flex flex-column lh-sm">
                      <span className="lab-name">{lab.name}</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {lab.total} item{lab.total === 1 ? '' : 's'} registered
                      </span>
                    </div>
                  </div>
                  <Link to={`/admin/inventory?lab=${lab.id}`} className="btn btn-sm btn-outline-secondary">
                    Inventory <i className="bi bi-arrow-right-short"></i>
                  </Link>
                </div>

                <div className="card-body">
                  <div className="section-label">Custodian</div>
                  {lab.staff.length ? (
                    lab.staff.map((c) => (
                      <div key={c.id} className="d-flex align-items-center gap-2 mb-2">
                        <span className="avatar-chip">{initials(c.fullName)}</span>
                        <div className="d-flex flex-column lh-sm" style={{ minWidth: 0 }}>
                          <span className="fw-medium" style={{ fontSize: '0.88rem' }}>{c.fullName}</span>
                          <span className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{c.email}</span>
                        </div>
                        {c.status !== 'approved' && <span className="badge soft-warning ms-1">{c.status}</span>}
                      </div>
                    ))
                  ) : (
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span
                        className="avatar-chip"
                        style={{ background: 'var(--danger-bg)', color: 'var(--danger-fg)', boxShadow: 'none' }}
                      >
                        <i className="bi bi-exclamation-lg"></i>
                      </span>
                      <div className="d-flex flex-column lh-sm">
                        <span className="fw-medium text-danger" style={{ fontSize: '0.88rem' }}>No custodian assigned</span>
                        <Link to="/admin/users" style={{ fontSize: '0.75rem' }}>Create an account &rarr;</Link>
                      </div>
                    </div>
                  )}

                  <div className="section-label mt-3">Inventory composition</div>
                  <CompositionBar durable={lab.durable} consumable={lab.consumable} max={maxTotal} height={12} />

                  <div className="d-flex justify-content-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <Metric value={lab.total} label="Total" />
                    <Metric value={lab.durable} label="Durable" />
                    <Metric value={lab.consumable} label="Consumable" />
                    <Metric value={lab.borrowed} label="Borrowed" color={lab.borrowed ? 'text-primary' : ''} />
                    <Metric value={lab.flagged} label="Expiring" color={lab.flagged ? 'text-danger' : ''} />
                  </div>

                  {!approved.length && lab.staff.length > 0 && (
                    <div className="alert alert-warning mt-3 mb-0 py-2" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-hourglass-split me-1"></i>
                      This lab's custodian account is still pending approval.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
