import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { listAllTransactions, releaseTransaction } from '../../services/transactions.js';
import { findAvailableByCategory, findEquipmentByUnitCode } from '../../services/equipment.js';
import { errorMessage } from '../../utils/errors.js';
import Alert from '../../components/Alert.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import QRScannerModal from '../../components/QRScannerModal.jsx';

export default function LabRelease() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [showExpired, setShowExpired] = useState(false);
  const [equipmentId, setEquipmentId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);

  function load() {
    if (!user) return;
    listAllTransactions(user.labId).then((all) =>
      setTransactions(all.filter((t) => t.kind === 'durable' && (t.status === 'pending' || t.status === 'approved')))
    );
  }

  useEffect(() => { load(); }, [user]);

  function loadUnits(categoryId, includeExpired) {
    findAvailableByCategory(categoryId, { includeExpired }).then((units) => {
      setAvailableUnits(units);
      setEquipmentId(units[0]?.id || '');
    });
  }

  function selectTransaction(t) {
    setSelected(t);
    setShowExpired(false);
    setError('');
    setSuccess('');
    loadUnits(t.categoryId, false);
  }

  function toggleShowExpired() {
    setShowExpired((v) => {
      const next = !v;
      loadUnits(selected.categoryId, next);
      return next;
    });
  }

  /** Called by QRScannerModal when a code is detected */
  const handleScan = useCallback(async (code) => {
    setShowScanner(false);
    setScanning(true);
    setError('');
    try {
      const unit = await findEquipmentByUnitCode(code);
      if (!unit) {
        setError(`No equipment found for code "${code}". Make sure the QR tag matches a registered unit.`);
        setScanning(false);
        return;
      }
      // Find the matching pending/approved transaction for this unit's category
      const match = transactions.find(
        (t) => t.categoryId === unit.categoryId && (t.status === 'pending' || t.status === 'approved')
      );
      if (!match) {
        setError(`Scanned unit "${unit.unitCode}" belongs to category "${unit.categoryName}", but no pending request matches it.`);
        setScanning(false);
        return;
      }
      if (unit.status !== 'available') {
        setError(`Unit "${unit.unitCode}" is currently ${unit.status} and cannot be released.`);
        setScanning(false);
        return;
      }
      // Auto-release
      await releaseTransaction(match.id, unit.id, user);
      setSuccess(`✅ Unit ${unit.unitCode} released to ${match.borrowerName} via QR scan.`);
      setSelected(null);
      setAvailableUnits([]);
      setEquipmentId('');
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setScanning(false);
    }
  }, [transactions, user]);

  async function handleRelease(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await releaseTransaction(selected.id, equipmentId, user);
      const unit = availableUnits.find((u) => u.id === equipmentId);
      setSuccess(`✅ Unit ${unit?.unitCode || ''} released to ${selected.borrowerName}.`);
      setSelected(null);
      setAvailableUnits([]);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Release Equipment"
        subtitle="Hand over approved items to the borrower — scan a QR tag or pick the unit manually."
        icon="bi-box-arrow-up"
      />
      <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>
      {error && <Alert onClose={() => setError('')}>{error}</Alert>}

      {/* QR Scan-to-Release banner */}
      <div className="card border-0 mb-4" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' }}>
        <div className="card-body d-flex flex-wrap align-items-center gap-3 py-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 48, height: 48, background: 'rgba(250,204,21,0.15)' }}>
            <i className="bi bi-qr-code-scan text-warning fs-4" />
          </div>
          <div className="flex-grow-1 text-white">
            <div className="fw-semibold">Quick-Release via QR Scan</div>
            <div className="small text-white-50">
              Scan the equipment's QR tag to automatically match and release it to the waiting borrower.
            </div>
          </div>
          <button
            className="btn btn-warning btn-sm fw-semibold px-4"
            onClick={() => setShowScanner(true)}
            disabled={!transactions.length || scanning}
          >
            {scanning
              ? <><span className="spinner-border spinner-border-sm me-2" />Looking up…</>
              : <><i className="bi bi-qr-code-scan me-2" />Scan QR Tag</>}
          </button>
        </div>
      </div>

      <div className="row g-3">
        {/* Left: Pending Requests */}
        <div className="col-md-6">
          <div className="card h-100">
            <PanelHeader icon="bi-clock-history" title="Requests Ready for Release" count={transactions.length} />
            <div className="table-responsive">
              <table className="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Borrower</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className={selected?.id === t.id ? 'table-active' : ''}>
                      <td>
                        <div className="fw-semibold">{t.borrowerName}</div>
                        <div className="small text-muted">{new Date(t.requestedAt).toLocaleDateString()}</div>
                      </td>
                      <td>{t.categoryName}</td>
                      <td>
                        <span className={`badge ${t.status === 'approved' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className={`btn btn-sm ${selected?.id === t.id ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => selectTransaction(t)}
                        >
                          {selected?.id === t.id ? 'Selected' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!transactions.length && (
                    <EmptyState colSpan={4} icon="bi-check-circle" title="No pending releases — all clear!" />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Unit Selection Form */}
        <div className="col-md-6">
          {selected ? (
            <div className="card h-100">
              <PanelHeader
                icon="bi-person-check" tone="success"
                title={<>Releasing to <strong>{selected.borrowerName}</strong><span className="text-muted ms-1">· {selected.categoryName}</span></>}
              />
              <div className="card-body">
                <form onSubmit={handleRelease}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Select the specific unit to hand over</label>
                    <select
                      className="form-select"
                      value={equipmentId}
                      onChange={(e) => setEquipmentId(e.target.value)}
                      required
                    >
                      <option value="">— Choose unit —</option>
                      {availableUnits.map((u) => (
                        <option key={u.id} value={u.id}>{u.unitCode} — {u.name}</option>
                      ))}
                    </select>
                    {!availableUnits.length && (
                      <p className="small text-muted mt-1">
                        No available units in this category{showExpired ? '' : ' — try showing expired units'}.
                      </p>
                    )}
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="showExpiredRelease"
                      checked={showExpired}
                      onChange={toggleShowExpired}
                    />
                    <label className="form-check-label small text-muted" htmlFor="showExpiredRelease">
                      Show expired units too (not recommended)
                    </label>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={!equipmentId}>
                      <i className="bi bi-box-arrow-up me-2" />Confirm Release
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setSelected(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="card h-100 border-dashed">
              <div className="card-body d-flex flex-column align-items-center justify-content-center text-center text-muted py-5">
                <i className="bi bi-arrow-left-circle fs-1 mb-3 opacity-25" />
                <div className="fw-semibold">Select a request on the left</div>
                <div className="small">or use Scan QR Tag above to release instantly.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showScanner && (
        <QRScannerModal
          title="Scan Equipment QR Tag to Release"
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
