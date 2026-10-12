import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { listMaintenance, addMaintenanceRecord } from '../../services/maintenance.js';
import { listEquipment } from '../../services/equipment.js';
import { errorMessage } from '../../utils/errors.js';
import { EquipmentStatusBadge } from '../../components/Badges.jsx';
import Alert from '../../components/Alert.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const initialForm = { equipmentId: '', dateReported: today(), problem: '', actionTaken: '', resultingStatus: 'under_maintenance' };

export default function LabMaintenance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    if (user) {
      listMaintenance(user.labId).then(setRecords);
      listEquipment(user.labId).then((all) => setEquipmentOptions(all.filter((e) => e.itemType === 'durable')));
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await addMaintenanceRecord({ ...form, labId: user.labId }, user);
      setForm(initialForm);
      setSuccess('Maintenance record saved and equipment status updated.');
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const underMaintenance = equipmentOptions.filter((e) => e.status === 'under_maintenance').length;
  const unserviceable = equipmentOptions.filter((e) => e.status === 'unserviceable').length;

  return (
    <>
      <PageHeader
        title="Maintenance Logging"
        subtitle="Record repairs and servicing, and set the unit's resulting status."
        icon="bi-tools"
      />

      <div className="row g-3 mb-4">
        <StatCard label="Records Logged" value={records.length} icon="bi-journal-text" colClass="col-md-4" tone="brand" />
        <StatCard label="Under Maintenance" value={underMaintenance} color={underMaintenance ? 'text-warning' : ''} icon="bi-tools" colClass="col-md-4" tone="warning" />
        <StatCard label="Unserviceable" value={unserviceable} color={unserviceable ? 'text-danger' : ''} icon="bi-x-octagon" colClass="col-md-4" tone="danger" />
      </div>

      <div className="card mb-4">
        <PanelHeader icon="bi-clipboard2-plus" title="Log Maintenance / Repair" />
        <div className="card-body">
          <Alert onClose={() => setError('')}>{error}</Alert>
          <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-7">
              <label className="form-label">Equipment Unit</label>
              <select className="form-select" value={form.equipmentId} onChange={(e) => setForm({ ...form, equipmentId: e.target.value })} required>
                <option value="">Select unit</option>
                {equipmentOptions.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.unitCode} — {eq.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-5">
              <label className="form-label">Date Reported</label>
              <input type="date" className="form-control" value={form.dateReported} onChange={(e) => setForm({ ...form, dateReported: e.target.value })} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Problem Encountered</label>
              <input type="text" className="form-control" placeholder="e.g. Lens cracked / misaligned" value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Action Taken</label>
              <input type="text" className="form-control" placeholder="e.g. Sent to repair" value={form.actionTaken} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Resulting Status</label>
              <select className="form-select" value={form.resultingStatus} onChange={(e) => setForm({ ...form, resultingStatus: e.target.value })} required>
                <option value="available">Available (Serviceable)</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="unserviceable">Unserviceable (Decommissioned)</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary w-100">
                <i className="bi bi-save me-1"></i> Save
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <PanelHeader icon="bi-clock-history" title="Maintenance Records" count={records.length} />
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead><tr><th>Date</th><th>Unit</th><th>Problem</th><th>Action</th><th>Result</th><th>Recorded By</th></tr></thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.dateReported).toLocaleDateString()}</td>
                  <td>{r.unitCode} — {r.equipmentName}</td>
                  <td>{r.problem}</td>
                  <td>{r.actionTaken}</td>
                  <td><EquipmentStatusBadge status={r.resultingStatus} /></td>
                  <td>{r.recordedByName}</td>
                </tr>
              ))}
              {!records.length && <EmptyState colSpan={6} icon="bi-tools" title="No maintenance records yet." />}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
