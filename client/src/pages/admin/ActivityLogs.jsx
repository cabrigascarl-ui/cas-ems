import { useEffect, useMemo, useState } from 'react';
import { listActivityLogs } from '../../services/activityLogs.js';
import Pagination, { usePagination } from '../../components/Pagination.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ActivityFeed from '../../components/ActivityFeed.jsx';
import { ACTIVITY_ACTIONS, actionMeta } from '../../constants.js';
import { downloadCsv } from '../../utils/csv.js';

const PAGE_SIZE = 20;

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // The service already searches server-side; this page loads the recent slice
  // once and filters in memory so typing feels instant rather than round-tripping.
  useEffect(() => {
    listActivityLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return logs.filter((l) => {
      if (actionFilter && l.action !== actionFilter) return false;
      if (!term) return true;
      return [l.userName, l.action, l.details, actionMeta(l.action).label]
        .filter(Boolean).join(' ').toLowerCase().includes(term);
    });
  }, [logs, q, actionFilter]);

  const { page, pageCount, setPage, pageItems } = usePagination(filtered, PAGE_SIZE);

  useEffect(() => { setPage(1); }, [q, actionFilter, setPage]);

  // Only offer actions that actually occur in the loaded data.
  const presentActions = useMemo(() => {
    const seen = new Set(logs.map((l) => l.action));
    return Object.keys(ACTIVITY_ACTIONS).filter((a) => seen.has(a));
  }, [logs]);

  function handleExport() {
    downloadCsv('activity_logs.csv', filtered.map((l) => ({
      timestamp: l.createdAt || '',
      user: l.userName || 'System',
      action: l.action || '',
      action_label: actionMeta(l.action).label,
      details: l.details || '',
    })));
  }

  const hasFilters = Boolean(q.trim() || actionFilter);

  return (
    <>
      <PageHeader
        title="Activity Logs"
        subtitle="An append-only audit trail of every action taken across CAS-EMS."
        icon="bi-clock-history"
        actions={
          <button className="btn btn-outline-secondary" onClick={handleExport} disabled={!filtered.length}>
            <i className="bi bi-download"></i> Export CSV
          </button>
        }
      />

      <div className="toolbar">
        <div className="flex-fill" style={{ minWidth: 220 }}>
          <label className="form-label">Search</label>
          <div className="input-icon-group">
            <i className="bi bi-search input-icon"></i>
            <input
              type="search"
              className="form-control"
              placeholder="User, action, or details"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div style={{ minWidth: 190 }}>
          <label className="form-label">Action</label>
          <select className="form-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">All actions</option>
            {presentActions.map((a) => (
              <option key={a} value={a}>{ACTIVITY_ACTIONS[a].label}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            className="btn btn-outline-secondary"
            onClick={() => { setQ(''); setActionFilter(''); }}
          >
            Clear
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <span className="text-muted small">
            {filtered.length} of {logs.length} entries
          </span>
          {actionFilter && (
            <span className="filter-chip">
              {ACTIVITY_ACTIONS[actionFilter].label}
              <button onClick={() => setActionFilter('')} aria-label="Clear action filter">
                <i className="bi bi-x-lg" style={{ fontSize: '0.6rem' }}></i>
              </button>
            </span>
          )}
          {q.trim() && (
            <span className="filter-chip">
              “{q.trim()}”
              <button onClick={() => setQ('')} aria-label="Clear search">
                <i className="bi bi-x-lg" style={{ fontSize: '0.6rem' }}></i>
              </button>
            </span>
          )}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="p-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="d-flex gap-3 py-2 align-items-center">
                <span className="skeleton" style={{ width: 31, height: 31, borderRadius: '50%', flexShrink: 0 }} />
                <div className="flex-fill">
                  <span className="skeleton mb-2" style={{ height: 10, width: '32%' }} />
                  <span className="skeleton" style={{ height: 10, width: '62%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : pageItems.length ? (
          <ActivityFeed logs={pageItems} grouped />
        ) : (
          <EmptyState
            icon={hasFilters ? 'bi-search' : 'bi-clock-history'}
            title={hasFilters ? 'No matching activity.' : 'No activity yet.'}
            text={hasFilters ? 'Try a different search term or action.' : 'Actions will appear here as staff use the system.'}
            action={hasFilters
              ? <button className="btn btn-sm btn-outline-secondary" onClick={() => { setQ(''); setActionFilter(''); }}>Clear filters</button>
              : undefined}
          />
        )}
        <Pagination
          page={page}
          pageCount={pageCount}
          onChange={setPage}
          total={filtered.length}
          pageSize={PAGE_SIZE}
        />
      </div>
    </>
  );
}
