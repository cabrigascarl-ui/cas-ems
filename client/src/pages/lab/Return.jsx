import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { listAllTransactions, returnTransaction } from '../../services/transactions.js';
import { findEquipmentByUnitCode } from '../../services/equipment.js';
import { errorMessage } from '../../utils/errors.js';
import { RETURN_CONDITIONS, returnConditionLabel } from '../../constants.js';
import { OverdueBadge } from '../../components/Badges.jsx';
import Alert from '../../components/Alert.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import QRScannerModal from '../../components/QRScannerModal.jsx';

export default function LabReturn() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [condition, setCondition] = useState('good');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);

  function load() {
    if (!user) return;
    listAllTransactions(user.labId).then((all) =>
      setTransactions(all.filter((t) => t.kind === 'durable' && t.status === 'released'))
    );
  }

  useEffect(() => { load(); }, [user]);

  function selectTransaction(t) {
    setSelected(t);
    setCondition('good');
    setRemarks('');
    setError('');
    setSuccess('');
  }

  /** QR scan → auto-find the released transaction for this unit */
  const handleScan = useCallback(async (code) => {
    setShowScanner(false);
    setScanning(true);
    setError('');
    try {
      // First try matching directly by unitCode in transaction list
      let match = transactions.find(
        (t) => t.unitCode && t.unitCode.toLowerCase() === code.trim().toLowerCase()
      );
      // Fallback: look up equipment then match by equipmentId
      if (!match) {
        const unit = await findEquipmentByUnitCode(code);
        if (unit) {
          match = transactions.find((t) => t.equipmentId === unit.id);
        }
      }
      if (!match) {
        setError(`No released item matches QR code "${code}". Make sure the item is currently out on loan.`);
        setScanning(false);
        return;
      }
      // Pre-select that transaction
      selectTransaction(match);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setScanning(false);
    }
  }, [transactions]);

  async function handleReturn(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await returnTransaction(selected.id, condition, remarks, user);
      setSuccess(
        `✅ Unit ${selected.unitCode} ${condition === 'lost' ? 'recorded as lost' : 'returned successfully'} from ${selected.borrowerName}.`
      );
      setSelected(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Return Equipment"
        subtitle="Take back released units and record the condition — scan the QR tag for instant look-up."
        icon="bi-box-arrow-in-down"
      />
      <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>
      {error && <Alert onClose={() => setError('')}>{error}</Alert>}

      {/* QR Scan-to-Find banner */}
      <div className="card border-0 mb-4" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' }}>
        <div className="card-body d-flex flex-wrap align-items-center gap-3 py-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 48, height: 48, background: 'rgba(250,204,21,0.15)' }}>
            <i className="bi bi-qr-code-scan text-warning fs-4" />
          </div>
          <div className="flex-grow-1 text-white">
            <div className="fw-semibold">Quick-Return via QR Scan</div>
            <div className="small text-white-50">
              Scan the equipment's QR tag to instantly find who borrowed it — then confirm the return.
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
        {/* Left: Currently Released Items */}
        <div className="col-md-6">
          <div className="card h-100">
            <PanelHeader icon="bi-arrow-up-right-circle" tone="warning" title="Currently Released" count={transactions.length} />
            <div className="table-responsive">
              <table className="table table-sm mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Borrower</th>
                    <th>Unit</th>
                    <th>Expected Return</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className={selected?.id === t.id ? 'table-active' : ''}>
                      <td>
                        <div className="fw-semibold">{t.borrowerName}</div>
                        <div className="small text-muted">{t.categoryName}</div>
                      </td>
                      <td className="font-monospace small fw-semibold">{t.unitCode || '—'}</td>
                      <td>
                        <span className="small">
                          {t.expectedReturn ? new Date(t.expectedReturn).toLocaleDateString() : '—'}
                        </span>
                        {' '}
                        <OverdueBadge transaction={t} />
                      </td>
                      <td className="text-end">
                        <button
                          className={`btn btn-sm ${selected?.id === t.id ? 'btn-warning' : 'btn-outline-warning'}`}
                          onClick={() => selectTransaction(t)}
                        >
                          {selected?.id === t.id ? 'Selected' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!transactions.length && (
                    <EmptyState colSpan={4} icon="bi-inbox" title="Nothing out on loan." />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Return Form */}
        <div className="col-md-6">
          {selected ? (
            <div className="card h-100">
              <PanelHeader
                icon="bi-box-arrow-in-down" tone="warning"
                title={<>Receiving <strong className="font-monospace">{selected.unitCode}</strong> from <strong>{selected.borrowerName}</strong></>}
              />
              <div className="card-body">
                <form onSubmit={handleReturn}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Condition on Return</label>
                    <select
                      className="form-select"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      required
                    >
                      {RETURN_CONDITIONS.map((c) => (
                        <option key={c} value={c}>{returnConditionLabel(c)}</option>
                      ))}
                    </select>
                    {condition === 'lost' && (
                      <div className="alert alert-danger d-flex align-items-center gap-2 mt-2 py-2 small">
                        <i className="bi bi-exclamation-triangle-fill" />
                        This marks the unit as unserviceable — use only when the item was never returned.
                      </div>
                    )}
                    {condition === 'needs_repair' && (
                      <div className="alert alert-warning d-flex align-items-center gap-2 mt-2 py-2 small">
                        <i className="bi bi-tools" />
                        Unit will be flagged for maintenance after return.
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Remarks <span className="text-muted fw-normal">(optional)</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. minor scratches on casing"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-warning fw-semibold">
                      <i className="bi bi-box-arrow-in-down me-2" />Confirm Return
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
                <div className="fw-semibold">Select an item on the left</div>
                <div className="small">or scan its QR tag above to find it instantly.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showScanner && (
        <QRScannerModal
          title="Scan Equipment QR Tag to Find Return"
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
