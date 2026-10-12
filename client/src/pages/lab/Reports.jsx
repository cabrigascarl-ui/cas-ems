import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { EquipmentStatusBadge, TransactionStatusBadge, ExpiryBadge } from '../../components/Badges.jsx';
import { listEquipment } from '../../services/equipment.js';
import { listAllTransactions } from '../../services/transactions.js';
import { listMaintenance } from '../../services/maintenance.js';
import { downloadCsv } from '../../utils/csv.js';
import { labName } from '../../constants.js';
import Pagination, { usePagination } from '../../components/Pagination.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const REPORT_ICONS = { inventory: 'bi-boxes', transactions: 'bi-arrow-left-right', maintenance: 'bi-tools' };

function fmtDt(dt) { return dt ? new Date(dt).toLocaleString() : '—'; }
function fmtD(d) { return d ? new Date(d).toLocaleDateString() : '—'; }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function thisMonthStr() { return new Date().toISOString().slice(0, 7); }

function inRange(dateStr, from, to) {
  if (!dateStr) return !from && !to;
  const d = dateStr.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export default function LabReports() {
  const { user } = useAuth();
  const [report, setReport] = useState('inventory');
  const [equipment, setEquipment] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Inventory print-out filters: acquired on a specific day, or in a specific
  // month, narrowed further by category ("All", or one like Ballpen / Books / Laptop).
  const [invDateMode, setInvDateMode] = useState('all'); // 'all' | 'day' | 'month'
  const [invDay, setInvDay] = useState(todayStr());
  const [invMonth, setInvMonth] = useState(thisMonthStr());
  const [invCategory, setInvCategory] = useState('');

  useEffect(() => {
    if (!user) return;
    listEquipment(user.labId).then(setEquipment);
    listAllTransactions(user.labId).then(setTransactions);
    listMaintenance(user.labId).then(setMaintenance);
  }, [user]);

  const categories = useMemo(
    () => [...new Set(equipment.map((e) => e.categoryName).filter(Boolean))].sort(),
    [equipment]
  );

  const filteredInventory = useMemo(() => equipment.filter((e) => {
    if (invCategory && e.categoryName !== invCategory) return false;
    if (invDateMode === 'day' && (e.dateAcquired || '').slice(0, 10) !== invDay) return false;
    if (invDateMode === 'month' && (e.dateAcquired || '').slice(0, 7) !== invMonth) return false;
    return true;
  }), [equipment, invCategory, invDateMode, invDay, invMonth]);

  const filteredTransactions = useMemo(
    () => transactions.filter((t) => inRange(t.requestedAt, fromDate, toDate)),
    [transactions, fromDate, toDate]
  );
  const filteredMaintenance = useMemo(
    () => maintenance.filter((m) => inRange(m.dateReported, fromDate, toDate)),
    [maintenance, fromDate, toDate]
  );

  const inventoryPaged = usePagination(filteredInventory);
  const transactionsPaged = usePagination(filteredTransactions);
  const maintenancePaged = usePagination(filteredMaintenance);

  const inventoryPrintLabel = invDateMode === 'day'
    ? `Acquired on ${fmtD(invDay)}`
    : invDateMode === 'month'
      ? `Acquired in ${new Date(`${invMonth}-01`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
      : 'All dates';

  function handlePrint() {
    window.print();
  }

  function handleExport() {
    if (report === 'inventory') {
      downloadCsv('inventory_report.csv', filteredInventory.map((e) => ({
        type: e.itemType, unit_code: e.unitCode || '', name: e.name, category: e.categoryName,
        status: e.status || '', stock: e.stockQuantity ?? '', unit_of_measure: e.unitOfMeasure || '',
        expiration_date: e.expirationDate || '', date_acquired: e.dateAcquired,
      })));
    } else if (report === 'transactions') {
      downloadCsv('transactions_report.csv', filteredTransactions.map((t) => ({
        kind: t.kind, unit_code: t.unitCode || '', category: t.categoryName, borrower: t.borrowerName,
        quantity: t.quantity ?? '', status: t.status, requested_at: t.requestedAt,
        released_at: t.releasedAt || t.issuedAt || '', returned_at: t.returnedAt || '', condition: t.returnCondition || '',
      })));
    } else {
      downloadCsv('maintenance_report.csv', filteredMaintenance.map((m) => ({
        date: m.dateReported, unit_code: m.unitCode, name: m.equipmentName, problem: m.problem,
        action_taken: m.actionTaken, result: m.resultingStatus, recorded_by: m.recordedByName,
      })));
    }
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Inventory, transaction, and maintenance records for your laboratory — printable or exportable."
        icon="bi-file-earmark-bar-graph"
        actions={
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={handleExport}>
              <i className="bi bi-download"></i> Export CSV
            </button>
            {report === 'inventory' && (
              <button className="btn btn-primary" onClick={handlePrint}>
                <i className="bi bi-printer"></i> Print
              </button>
            )}
          </div>
        }
      />

      <ul className="nav nav-tabs mb-3 no-print">
        {['inventory', 'transactions', 'maintenance'].map((r) => (
          <li className="nav-item" key={r}>
            <button className={'nav-link' + (report === r ? ' active' : '')} onClick={() => setReport(r)}>
              <i className={`bi ${REPORT_ICONS[r]} me-1`}></i>
              {r[0].toUpperCase() + r.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {report === 'inventory' && (
        <div className="toolbar no-print">
          <div>
            <label className="form-label">Period</label>
            <div className="btn-group btn-group-sm d-block">
              {[['all', 'All'], ['day', 'Day'], ['month', 'Month']].map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  className={'btn btn-outline-secondary' + (invDateMode === mode ? ' active' : '')}
                  onClick={() => setInvDateMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {invDateMode === 'day' && (
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={invDay} onChange={(e) => setInvDay(e.target.value)} />
            </div>
          )}
          {invDateMode === 'month' && (
            <div>
              <label className="form-label">Month</label>
              <input type="month" className="form-control" value={invMonth} onChange={(e) => setInvMonth(e.target.value)} />
            </div>
          )}
          <div style={{ minWidth: 180 }}>
            <label className="form-label">Category</label>
            <select className="form-select" value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {(invDateMode !== 'all' || invCategory) && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => { setInvDateMode('all'); setInvCategory(''); }}>Clear</button>
          )}
        </div>
      )}

      {report !== 'inventory' && (
        <div className="toolbar no-print">
          <div>
            <label className="form-label">From</label>
            <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          {(fromDate || toDate) && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => { setFromDate(''); setToDate(''); }}>Clear</button>
          )}
        </div>
      )}

      {report === 'inventory' && (
        <div className="d-none d-print-block mb-3">
          <h4 className="mb-1">{labName(user?.labId)} — Inventory Report</h4>
          <div className="text-muted small">
            {inventoryPrintLabel}{invCategory ? ` · ${invCategory}` : ' · All categories'} · Generated {new Date().toLocaleString()}
          </div>
        </div>
      )}

      <div className="card">
        <PanelHeader
          icon={REPORT_ICONS[report]}
          title={`${report[0].toUpperCase()}${report.slice(1)} Report`}
          count={report === 'inventory' ? filteredInventory.length : report === 'transactions' ? filteredTransactions.length : filteredMaintenance.length}
        />
        <div className="table-responsive">
          {report === 'inventory' && (
            <table className="table table-sm mb-0">
              <thead><tr><th>Type</th><th>Unit Code / Name</th><th>Category</th><th>Status / Stock</th><th>Expiry</th><th>Acquired</th></tr></thead>
              <tbody>
                {/*
                  Pagination only shows one page on screen, but a print-out should
                  cover every filtered item — so rows outside the current page stay
                  in the DOM (hidden on screen) and are revealed by the print stylesheet.
                */}
                {filteredInventory.map((r) => (
                  <tr key={r.id} className={inventoryPaged.pageItems.includes(r) ? '' : 'd-none d-print-table-row'}>
                    <td className="text-capitalize">{r.itemType}</td>
                    <td>{r.itemType === 'durable' ? `${r.unitCode || '—'} — ${r.name}` : r.name}</td>
                    <td>{r.categoryName}</td>
                    <td>{r.itemType === 'durable' ? <EquipmentStatusBadge status={r.status} /> : `${r.stockQuantity} ${r.unitOfMeasure}`}</td>
                    <td><ExpiryBadge expirationDate={r.expirationDate} /></td>
                    <td>{fmtD(r.dateAcquired)}</td>
                  </tr>
                ))}
                {!filteredInventory.length && <EmptyState colSpan={6} icon="bi-box-seam" title="No items match this filter." />}
              </tbody>
            </table>
          )}
          {report === 'transactions' && (
            <table className="table table-sm mb-0">
              <thead><tr><th>Kind</th><th>Unit / Category</th><th>Borrower</th><th>Qty</th><th>Status</th><th>Requested</th><th>Released/Issued</th><th>Returned</th></tr></thead>
              <tbody>
                {transactionsPaged.pageItems.map((r) => (
                  <tr key={r.id}>
                    <td className="text-capitalize">{r.kind}</td>
                    <td>{r.unitCode || r.categoryName}</td>
                    <td>{r.borrowerName}</td>
                    <td>{r.quantity ?? '—'}</td>
                    <td><TransactionStatusBadge status={r.status} /></td>
                    <td>{fmtDt(r.requestedAt)}</td>
                    <td>{fmtDt(r.releasedAt || r.issuedAt)}</td>
                    <td>{fmtDt(r.returnedAt)}</td>
                  </tr>
                ))}
                {!transactionsPaged.pageItems.length && <EmptyState colSpan={8} icon="bi-arrow-left-right" title="No transactions in this range." />}
              </tbody>
            </table>
          )}
          {report === 'maintenance' && (
            <table className="table table-sm mb-0">
              <thead><tr><th>Date</th><th>Unit</th><th>Problem</th><th>Action</th><th>Result</th><th>Recorded By</th></tr></thead>
              <tbody>
                {maintenancePaged.pageItems.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtD(r.dateReported)}</td>
                    <td>{r.unitCode} — {r.equipmentName}</td>
                    <td>{r.problem}</td>
                    <td>{r.actionTaken}</td>
                    <td><EquipmentStatusBadge status={r.resultingStatus} /></td>
                    <td>{r.recordedByName}</td>
                  </tr>
                ))}
                {!maintenancePaged.pageItems.length && <EmptyState colSpan={6} icon="bi-tools" title="No maintenance records in this range." />}
              </tbody>
            </table>
          )}
        </div>
        {report === 'inventory' && <Pagination page={inventoryPaged.page} pageCount={inventoryPaged.pageCount} onChange={inventoryPaged.setPage} />}
        {report === 'transactions' && <Pagination page={transactionsPaged.page} pageCount={transactionsPaged.pageCount} onChange={transactionsPaged.setPage} />}
        {report === 'maintenance' && <Pagination page={maintenancePaged.page} pageCount={maintenancePaged.pageCount} onChange={maintenancePaged.setPage} />}
      </div>
    </>
  );
}
