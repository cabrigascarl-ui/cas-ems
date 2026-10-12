import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listEquipment } from '../../services/equipment.js';
import { EquipmentStatusBadge, ExpiryBadge, LowStockBadge } from '../../components/Badges.jsx';
import Pagination, { usePagination } from '../../components/Pagination.jsx';
import { downloadCsv } from '../../utils/csv.js';
import { LABS, ITEM_TYPES, EQUIPMENT_STATUSES, labName, labIcon, expiryState, isLowStock } from '../../constants.js';
import PageHeader from '../../components/PageHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const FLAG_LABELS = {
  borrowed: 'Currently borrowed',
  expiring: 'Expiring / expired',
  lowStock: 'Low / out of stock',
};

export default function AdminInventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Every filter reads from the URL, so the sidebar's "Expiring & Expired Items"
  // link and the dashboard's lab links stay live even when this page is already
  // mounted — the same staleness trap the Users page had.
  const labFilter = searchParams.get('lab') || '';
  const typeFilter = searchParams.get('type') || '';
  const statusFilter = searchParams.get('status') || '';
  const flagFilter = searchParams.get('flag') || ''; // 'borrowed' | 'expiring' | 'lowStock'

  useEffect(() => {
    listEquipment()
      .then(setEquipment)
      .finally(() => setLoading(false));
  }, []);

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  }

  function clearAll() {
    setSearchParams({});
    setSearch('');
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return equipment.filter((e) => {
      if (labFilter && e.labId !== labFilter) return false;
      if (typeFilter && e.itemType !== typeFilter) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      if (flagFilter === 'borrowed' && e.status !== 'borrowed') return false;
      if (flagFilter === 'expiring' && !expiryState(e.expirationDate)) return false;
      if (flagFilter === 'lowStock' && !isLowStock(e)) return false;
      if (term) {
        if (!e.name.toLowerCase().includes(term) && !(e.unitCode || '').toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [equipment, labFilter, typeFilter, statusFilter, flagFilter, search]);

  const { page, pageCount, setPage, pageItems } = usePagination(filtered);

  useEffect(() => { setPage(1); }, [labFilter, typeFilter, statusFilter, flagFilter, search, setPage]);

  function handleExport() {
    downloadCsv('all_labs_inventory.csv', filtered.map((e) => ({
      lab: labName(e.labId), type: e.itemType, unit_code: e.unitCode || '', name: e.name, category: e.categoryName,
      status: e.status || '', stock: e.stockQuantity ?? '', unit_of_measure: e.unitOfMeasure || '',
      expiration_date: e.expirationDate || '', date_acquired: e.dateAcquired,
    })));
  }

  const chips = [
    labFilter && { key: 'lab', label: labName(labFilter) },
    typeFilter && { key: 'type', label: ITEM_TYPES.find((t) => t.id === typeFilter)?.label || typeFilter },
    statusFilter && { key: 'status', label: statusFilter.replace(/_/g, ' ') },
    flagFilter && { key: 'flag', label: FLAG_LABELS[flagFilter] || flagFilter },
  ].filter(Boolean);

  const hasFilters = chips.length > 0 || Boolean(search.trim());

  return (
    <>
      <PageHeader
        title="Inventory — All Laboratories"
        subtitle="Every registered durable unit and consumable supply, across all six laboratories."
        icon="bi-boxes"
        actions={
          <button className="btn btn-outline-secondary" onClick={handleExport} disabled={!filtered.length}>
            <i className="bi bi-download"></i> Export CSV
          </button>
        }
      />

      <div className="toolbar">
        <div className="flex-fill" style={{ minWidth: 210 }}>
          <label className="form-label">Search</label>
          <div className="input-icon-group">
            <i className="bi bi-search input-icon"></i>
            <input
              type="search"
              className="form-control"
              placeholder="Name or unit code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div style={{ minWidth: 180 }}>
          <label className="form-label">Laboratory</label>
          <select className="form-select" value={labFilter} onChange={(e) => setParam('lab', e.target.value)}>
            <option value="">All laboratories</option>
            {LABS.map((lab) => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 165 }}>
          <label className="form-label">Type</label>
          <select className="form-select" value={typeFilter} onChange={(e) => setParam('type', e.target.value)}>
            <option value="">All types</option>
            {ITEM_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 165 }}>
          <label className="form-label">Status</label>
          <select className="form-select" value={statusFilter} onChange={(e) => setParam('status', e.target.value)}>
            <option value="">All statuses</option>
            {EQUIPMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      {hasFilters && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <span className="text-muted small">
            Showing <strong className="text-body">{filtered.length}</strong> of {equipment.length} items
          </span>
          {chips.map((c) => (
            <span className="filter-chip" key={c.key}>
              {c.label}
              <button onClick={() => setParam(c.key, '')} aria-label={`Clear ${c.label} filter`}>
                <i className="bi bi-x-lg" style={{ fontSize: '0.6rem' }}></i>
              </button>
            </span>
          ))}
          {search.trim() && (
            <span className="filter-chip">
              “{search.trim()}”
              <button onClick={() => setSearch('')} aria-label="Clear search">
                <i className="bi bi-x-lg" style={{ fontSize: '0.6rem' }}></i>
              </button>
            </span>
          )}
          <button className="btn btn-sm btn-outline-secondary" onClick={clearAll}>Clear all</button>
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Laboratory</th><th>Type</th><th>Unit Code / Name</th><th>Category</th>
                <th>Status / Stock</th><th>Expiry</th><th className="text-end">Acquired</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {Array.from({ length: 7 }, (__, c) => (
                    <td key={c}><span className="skeleton" style={{ height: 12, width: c === 2 ? '75%' : '55%' }} /></td>
                  ))}
                </tr>
              ))}
              {!loading && pageItems.map((e) => (
                <tr key={e.id}>
                  <td>
                    <span className="d-inline-flex align-items-center gap-2">
                      <i className={`bi ${labIcon(e.labId)} text-muted`}></i>
                      {labName(e.labId).replace(' Laboratory', '')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${e.itemType === 'durable' ? 'soft-primary' : 'soft-info'}`}>{e.itemType}</span>
                  </td>
                  <td>
                    {e.itemType === 'durable' ? (
                      <div className="d-flex flex-column lh-sm">
                        <span className="fw-medium">{e.unitCode || '—'}</span>
                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>{e.name}</span>
                      </div>
                    ) : (
                      <span className="fw-medium">{e.name}</span>
                    )}
                  </td>
                  <td>{e.categoryName}</td>
                  <td>
                    {e.itemType === 'durable' ? (
                      <EquipmentStatusBadge status={e.status} />
                    ) : (
                      <span className="d-flex align-items-center gap-2">
                        <span className="fw-medium">{e.stockQuantity} <span className="text-muted fw-normal">{e.unitOfMeasure}</span></span>
                        <LowStockBadge item={e} />
                      </span>
                    )}
                  </td>
                  <td><ExpiryBadge expirationDate={e.expirationDate} /></td>
                  <td className="text-end text-muted">{e.dateAcquired ? new Date(e.dateAcquired).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {!loading && !pageItems.length && (
                <EmptyState
                  colSpan={7}
                  icon={hasFilters ? 'bi-search' : 'bi-boxes'}
                  title={hasFilters ? 'No items match these filters.' : 'No inventory registered yet.'}
                  text={hasFilters ? 'Try widening the search or clearing a filter.' : 'Items appear here once lab custodians register them.'}
                  action={hasFilters
                    ? <button className="btn btn-sm btn-outline-secondary" onClick={clearAll}>Clear all filters</button>
                    : undefined}
                />
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} total={filtered.length} />
      </div>
    </>
  );
}
