import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import {
  listEquipment, listCategories, addCategory, addEquipment, setEquipmentStatus, restockConsumable,
} from '../../services/equipment.js';
import { errorMessage } from '../../utils/errors.js';
import { EQUIPMENT_STATUSES, ITEM_TYPES, isLowStock } from '../../constants.js';
import { ExpiryBadge, LowStockBadge } from '../../components/Badges.jsx';
import Alert from '../../components/Alert.jsx';
import Pagination from '../../components/Pagination.jsx';
import { usePagination } from '../../utils/pagination.js';
import { downloadCsv, parseCsv, readFileAsText } from '../../utils/csv.js';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import QRCodeModal from '../../components/QRCodeModal.jsx';
import PrintableQRLabels from '../../components/PrintableQRLabels.jsx';

const initialForm = {
  itemType: 'durable', name: '', categoryId: '', description: '', dateAcquired: '', expirationDate: '',
  unitCode: '', stockQuantity: '', unitOfMeasure: '', reorderThreshold: '',
};

const IMPORT_TEMPLATE = [
  { item_type: 'durable', category: 'Glassware', name: '250mL Beaker', description: 'Unit 3', unit_code: 'CHEM-BKR-003', stock_quantity: '', unit_of_measure: '', reorder_threshold: '', date_acquired: '2024-01-15', expiration_date: '' },
  { item_type: 'consumable', category: 'Personal Protective Equipment', name: 'Latex Gloves (Small)', description: 'Box of 100', unit_code: '', stock_quantity: '50', unit_of_measure: 'pairs', reorder_threshold: '20', date_acquired: '2024-01-15', expiration_date: '2026-06-01' },
];

export default function LabEquipment() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [typeTab, setTypeTab] = useState('durable');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState(initialForm);
  const [newCategory, setNewCategory] = useState('');
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockExpiry, setRestockExpiry] = useState('');
  const [importRows, setImportRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedQR, setSelectedQR] = useState(null);
  const [showPrintSheet, setShowPrintSheet] = useState(false);

  const loadEquipment = useCallback(() => {
    if (user) listEquipment(user.labId).then(setList);
  }, [user]);

  const loadCategories = useCallback(() => {
    if (user) listCategories(user.labId).then(setCategories);
  }, [user]);

  useEffect(() => { loadEquipment(); loadCategories(); }, [loadEquipment, loadCategories]);

  const filtered = useMemo(() => {
    return list.filter((e) => {
      if (e.itemType !== typeTab) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !(e.unitCode || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      return true;
    });
  }, [list, typeTab, search, statusFilter]);

  const { page, pageCount, setPage, pageItems } = usePagination(filtered);

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await addCategory(newCategory.trim(), user.labId);
    setNewCategory('');
    loadCategories();
  }

  async function handleAddEquipment(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await addEquipment({ ...form, labId: user.labId }, user);
      setSuccess(`${form.itemType === 'durable' ? 'Equipment' : 'Consumable item'} "${form.name}" registered.`);
      setForm({ ...initialForm, itemType: form.itemType });
      loadEquipment();
      const modalEl = document.getElementById('addEquipmentModal');
      window.bootstrap?.Modal.getOrCreateInstance(modalEl).hide();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleStatusChange(id, status) {
    await setEquipmentStatus(id, status, user);
    loadEquipment();
  }

  function openRestock(item) {
    setRestockTarget(item);
    setRestockQty('');
    setRestockExpiry(item.expirationDate || '');
    setTimeout(() => {
      window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('restockModal')).show();
    }, 0);
  }

  async function handleRestock(e) {
    e.preventDefault();
    setError('');
    try {
      await restockConsumable(restockTarget.id, restockQty, restockExpiry || null, user);
      setSuccess(`Stock updated for "${restockTarget.name}".`);
      loadEquipment();
      window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('restockModal')).hide();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null);
    const text = await readFileAsText(file);
    setImportRows(parseCsv(text));
    e.target.value = '';
  }

  async function confirmImport() {
    setImporting(true);
    let imported = 0;
    const errors = [];
    for (const [i, row] of importRows.entries()) {
      try {
        const itemType = (row.item_type || 'durable').trim().toLowerCase();
        let categoryId = categories.find((c) => c.name.toLowerCase() === (row.category || '').trim().toLowerCase())?.id;
        if (!categoryId && row.category) {
          await addCategory(row.category.trim(), user.labId);
          const fresh = await listCategories(user.labId);
          categoryId = fresh.find((c) => c.name.toLowerCase() === row.category.trim().toLowerCase())?.id;
        }
        if (!categoryId || !row.name) throw new Error('Missing category or name');
        await addEquipment({
          labId: user.labId, categoryId, itemType, name: row.name, description: row.description || '',
          unitCode: row.unit_code || '', stockQuantity: row.stock_quantity || '0', unitOfMeasure: row.unit_of_measure || 'units',
          reorderThreshold: row.reorder_threshold || '', dateAcquired: row.date_acquired || '', expirationDate: row.expiration_date || '',
        }, user);
        imported++;
      } catch (err) {
        errors.push(`Row ${i + 2}: ${errorMessage(err)}`);
      }
    }
    setImportResult({ imported, errors });
    setImportRows([]);
    setImporting(false);
    loadEquipment();
    loadCategories();
  }

  return (
    <>
      <PageHeader
        title="Equipment & Supplies"
        subtitle="Register, label, and track every durable unit and consumable supply in your laboratory."
        icon="bi-box-seam"
        actions={
          <>
            <button className="btn btn-outline-dark" onClick={() => setShowPrintSheet(true)} disabled={!filtered.length}>
              <i className="bi bi-printer me-1"></i> Print Batch Labels
            </button>
            <button className="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#importModal">
              <i className="bi bi-upload"></i> Bulk Import
            </button>
            <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addEquipmentModal">
              <i className="bi bi-plus-lg"></i> Register Item
            </button>
          </>
        }
      />

      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>

      <ul className="nav nav-tabs mb-3">
        {ITEM_TYPES.map((t) => (
          <li className="nav-item" key={t.id}>
            <button className={'nav-link' + (typeTab === t.id ? ' active' : '')} onClick={() => setTypeTab(t.id)}>
              <i className={`bi ${t.id === 'durable' ? 'bi-box-seam' : 'bi-droplet-half'} me-1`}></i>
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="toolbar">
        <div className="flex-fill" style={{ minWidth: 210 }}>
          <label className="form-label">Search</label>
          <div className="input-icon-group">
            <i className="bi bi-search input-icon"></i>
            <input type="text" className="form-control" placeholder="Name or unit code" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {typeTab === 'durable' && (
          <div style={{ minWidth: 180 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {EQUIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="card">
        <PanelHeader
          icon={typeTab === 'durable' ? 'bi-box-seam' : 'bi-droplet-half'}
          title={typeTab === 'durable' ? 'Durable Equipment' : 'Consumable Supplies'}
          count={filtered.length}
        />
        <div className="table-responsive">
          {typeTab === 'durable' ? (
            <table className="table table-sm align-middle mb-0">
              <thead><tr><th>Unit Code</th><th>Name</th><th>Category</th><th>Status</th><th>Expiry</th><th></th></tr></thead>
              <tbody>
                {pageItems.map((e) => (
                  <tr key={e.id}>
                    <td><span className="font-monospace fw-semibold">{e.unitCode || '—'}</span></td>
                    <td>{e.name}</td>
                    <td>{e.categoryName}</td>
                    <td>
                      <select className="form-select form-select-sm" style={{ width: 'auto' }} value={e.status} onChange={(ev) => handleStatusChange(e.id, ev.target.value)}>
                        {EQUIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td><ExpiryBadge expirationDate={e.expirationDate} /></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-dark me-1" title="View & Print QR Code" onClick={() => setSelectedQR(e)}>
                        <i className="bi bi-qr-code"></i> QR Tag
                      </button>
                      <Link to={`/lab/equipment/${e.id}`} className="btn btn-sm btn-outline-secondary">History</Link>
                    </td>
                  </tr>
                ))}
                {!pageItems.length && <EmptyState colSpan={6} icon="bi-box-seam" title="No durable equipment found." />}
              </tbody>
            </table>
          ) : (
            <table className="table table-sm align-middle mb-0">
              <thead><tr><th>Name</th><th>Category</th><th>Stock</th><th>Expiry</th><th></th></tr></thead>
              <tbody>
                {pageItems.map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.categoryName}</td>
                    <td>
                      <span className="d-flex align-items-center gap-2">
                        <span className={isLowStock(e) ? 'text-warning fw-semibold' : ''}>{e.stockQuantity} {e.unitOfMeasure}</span>
                        <LowStockBadge item={e} />
                      </span>
                    </td>
                    <td><ExpiryBadge expirationDate={e.expirationDate} /></td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-dark me-1" title="View & Print QR Code" onClick={() => setSelectedQR(e)}>
                        <i className="bi bi-qr-code"></i> QR Tag
                      </button>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openRestock(e)}>Add Stock</button>
                      <Link to={`/lab/equipment/${e.id}`} className="btn btn-sm btn-outline-secondary">History</Link>
                    </td>
                  </tr>
                ))}
                {!pageItems.length && <EmptyState colSpan={5} icon="bi-droplet-half" title="No consumable items found." />}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </div>

      {/* Register Item Modal */}
      <div className="modal fade" id="addEquipmentModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleAddEquipment}>
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <span className="panel-icon tone-brand"><i className="bi bi-plus-lg"></i></span>
                  Register Item
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Item Type</label>
                  <select className="form-select" value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })}>
                    {ITEM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <div className="input-group">
                    <select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button className="btn btn-outline-secondary" type="button" data-bs-toggle="modal" data-bs-target="#addCategoryModal">+ New</button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Item Name</label>
                  <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
                </div>

                {form.itemType === 'durable' ? (
                  <div className="mb-3">
                    <label className="form-label">Unit Code (asset tag)</label>
                    <input type="text" className="form-control" placeholder="e.g. CHEM-BKR-002" value={form.unitCode} onChange={(e) => setForm({ ...form, unitCode: e.target.value })} />
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Starting Stock Quantity</label>
                      <input type="number" min="0" className="form-control" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Unit of Measure</label>
                      <input type="text" className="form-control" placeholder="pairs, boxes, mL…" value={form.unitOfMeasure} onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Reorder Threshold</label>
                      <input type="number" min="0" className="form-control" placeholder="Optional" value={form.reorderThreshold} onChange={(e) => setForm({ ...form, reorderThreshold: e.target.value })} />
                    </div>
                  </div>
                )}

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Date Acquired</label>
                    <input type="date" className="form-control" value={form.dateAcquired} onChange={(e) => setForm({ ...form, dateAcquired: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Expiration Date</label>
                    <input type="date" className="form-control" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">Register Item</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      <div className="modal fade" id="addCategoryModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleAddCategory}>
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <span className="panel-icon tone-brand"><i className="bi bi-tags"></i></span>
                  New Category
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body">
                <input type="text" className="form-control" placeholder="Category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Restock Modal */}
      <div className="modal fade" id="restockModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleRestock}>
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <span className="panel-icon tone-success"><i className="bi bi-box-seam"></i></span>
                  Add Stock — {restockTarget?.name}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small">Current stock: {restockTarget?.stockQuantity} {restockTarget?.unitOfMeasure}</p>
                <div className="mb-3">
                  <label className="form-label">Quantity to Add</label>
                  <input type="number" min="1" className="form-control" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Expiration Date (if this batch differs)</label>
                  <input type="date" className="form-control" value={restockExpiry} onChange={(e) => setRestockExpiry(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">Add Stock</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Bulk Import Modal */}
      <div className="modal fade" id="importModal" tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center gap-2">
                <span className="panel-icon tone-info"><i className="bi bi-upload"></i></span>
                Bulk Import Items
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p className="text-muted small">
                Upload a CSV with columns: <code>item_type</code> (durable/consumable), <code>category</code>,
                <code> name</code>, <code>description</code>, <code>unit_code</code>, <code>stock_quantity</code>,
                <code> unit_of_measure</code>, <code>reorder_threshold</code>, <code>date_acquired</code>, <code>expiration_date</code>.
                Categories that don't exist yet are created automatically.
              </p>
              <button type="button" className="btn btn-sm btn-outline-secondary mb-3" onClick={() => downloadCsv('equipment_import_template.csv', IMPORT_TEMPLATE)}>
                <i className="bi bi-download"></i> Download Template
              </button>
              <div className="mb-3">
                <input type="file" accept=".csv" className="form-control" onChange={handleImportFile} />
              </div>

              {importRows.length > 0 && (
                <>
                  <p className="small fw-semibold">{importRows.length} row(s) ready to import.</p>
                  <div className="table-responsive mb-3" style={{ maxHeight: 240, overflowY: 'auto' }}>
                    <table className="table table-sm">
                      <thead><tr><th>Type</th><th>Category</th><th>Name</th><th>Qty/Code</th></tr></thead>
                      <tbody>
                        {importRows.slice(0, 20).map((r, i) => (
                          <tr key={i}>
                            <td>{r.item_type}</td>
                            <td>{r.category}</td>
                            <td>{r.name}</td>
                            <td>{r.item_type === 'consumable' ? r.stock_quantity : r.unit_code}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" className="btn btn-primary" disabled={importing} onClick={confirmImport}>
                    {importing ? 'Importing…' : `Import ${importRows.length} Item(s)`}
                  </button>
                </>
              )}

              {importResult && (
                <Alert type={importResult.errors.length ? 'warning' : 'success'} onClose={() => setImportResult(null)}>
                  Imported {importResult.imported} item(s).
                  {importResult.errors.length > 0 && (
                    <ul className="mb-0 mt-2 small">
                      {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  )}
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedQR && <QRCodeModal item={selectedQR} onClose={() => setSelectedQR(null)} />}
      {showPrintSheet && <PrintableQRLabels items={filtered} labId={user?.labId} onClose={() => setShowPrintSheet(false)} />}
    </>
  );
}
