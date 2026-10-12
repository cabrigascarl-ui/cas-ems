import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { listUsers, createStaffAccount, setUserStatus } from '../../services/users.js';
import { errorMessage } from '../../utils/errors.js';
import { UserStatusBadge } from '../../components/Badges.jsx';
import Alert from '../../components/Alert.jsx';
import Pagination from '../../components/Pagination.jsx';
import { usePagination } from '../../utils/pagination.js';
import { downloadCsv } from '../../utils/csv.js';
import { ROLES, roleLabel, LABS, labName } from '../../constants.js';
import PageHeader from '../../components/PageHeader.jsx';
import PanelHeader from '../../components/PanelHeader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const initialForm = { fullName: '', email: '', role: '', labId: '', password: '' };

/** Role reads as identity, so it gets its own tint rather than a plain string. */
const ROLE_BADGE = {
  admin: 'soft-primary',
  lab_custodian: 'soft-info',
  borrower: 'soft-neutral',
};

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
}

/**
 * The sidebar's "Borrowers" (?role=borrower) and "Pending Registrations"
 * (?status=pending) entries — and the dashboard stat cards — all render this
 * page with a different query. This turns that query into the page's identity:
 * heading, empty state, CSV name, and whether the staff-creation form is
 * relevant to what the admin came here to do.
 */
function viewFor(role, status) {
  if (status === 'pending') {
    return {
      title: 'Pending Registrations',
      lead: 'Borrower accounts awaiting review. Approving one lets that person log in immediately.',
      icon: 'bi-hourglass-split',
      empty: 'No pending registrations — everything has been reviewed.',
      csvName: 'pending_registrations.csv',
      detailsHeader: 'Program / Section',
      showCreateForm: false,
    };
  }
  if (role === 'borrower') {
    return {
      title: 'Borrowers',
      lead: 'Faculty, staff, and students registered to borrow equipment from the College of Arts and Sciences.',
      icon: 'bi-person',
      empty: 'No borrowers match these filters.',
      csvName: 'borrowers.csv',
      detailsHeader: 'Program / Section',
      showCreateForm: false,
    };
  }
  if (role === 'lab_custodian') {
    return {
      title: 'Laboratory Custodians',
      lead: 'Staff accounts assigned to manage each laboratory’s inventory.',
      icon: 'bi-person-badge',
      empty: 'No laboratory custodians match these filters.',
      csvName: 'lab_custodians.csv',
      detailsHeader: 'Laboratory',
      showCreateForm: true,
    };
  }
  return {
    title: 'Manage Users',
    lead: 'All CAS-EMS accounts across every role and laboratory.',
    icon: 'bi-people',
    empty: 'No users match these filters.',
    csvName: 'users.csv',
    detailsHeader: 'Laboratory / Details',
    showCreateForm: true,
  };
}

/** The one extra identifying line that's meaningful for this user's role. */
function userDetails(u) {
  if (u.role === 'lab_custodian') return labName(u.labId);
  if (u.role === 'borrower') {
    return [u.program, u.section && `Section ${u.section}`].filter(Boolean).join(' · ') || '—';
  }
  return '—';
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // The URL is the single source of truth for the filters. Seeding component
  // state from the query on first render alone would go stale the moment the
  // admin clicked a second sidebar link, because React Router keeps this same
  // element mounted and only swaps the query string.
  const roleFilter = searchParams.get('role') || '';
  const statusFilter = searchParams.get('status') || '';
  const view = viewFor(roleFilter, statusFilter);
  // The Role column is pure repetition once the table is already filtered to
  // one role — every row would read "Laboratory Custodian" under a heading
  // that already says "Laboratory Custodians". Dropping it narrows a table
  // that's otherwise wide enough to force horizontal scroll on some screens.
  const showRoleColumn = !roleFilter;
  const columnCount = showRoleColumn ? 7 : 6;

  function load() {
    setLoading(true);
    listUsers()
      .then(setUsers)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function updateFilter(next) {
    const role = next.role ?? roleFilter;
    const status = next.status ?? statusFilter;
    const params = {};
    if (role) params.role = role;
    if (status) params.status = status;
    setSearchParams(params);
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      if (term) {
        const haystack = [u.fullName, u.email, u.idNumber, u.program, u.section]
          .filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  const { page, pageCount, setPage, pageItems } = usePagination(filtered);

  // Switching views (or searching) should always land on page 1 — usePagination
  // only resets itself when the result count happens to change.
  useEffect(() => { setPage(1); }, [roleFilter, statusFilter, search, setPage]);

  // Bootstrap fires this after the fade-out, so the modal keeps showing the
  // right name while it animates away.
  useEffect(() => {
    const el = document.getElementById('rejectUserModal');
    if (!el) return undefined;
    const clear = () => setRejecting(null);
    el.addEventListener('hidden.bs.modal', clear);
    return () => el.removeEventListener('hidden.bs.modal', clear);
  }, []);

  function hideRejectModal() {
    window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('rejectUserModal')).hide();
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);
    try {
      await createStaffAccount(form, me);
      setSuccess(`Account created for ${form.email}.`);
      setForm(initialForm);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleApprove(u) {
    setError('');
    setSuccess('');
    setBusyId(u.id);
    try {
      await setUserStatus(u.id, 'approved', me);
      setSuccess(`${u.fullName} approved and can now log in.`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function openReject(u) {
    setRejecting(u);
    setRejectReason('');
    setTimeout(() => window.bootstrap?.Modal.getOrCreateInstance(document.getElementById('rejectUserModal')).show(), 0);
  }

  async function confirmReject(e) {
    e.preventDefault();
    const target = rejecting;
    setError('');
    setSuccess('');
    setBusyId(target.id);
    try {
      await setUserStatus(target.id, 'rejected', me, rejectReason.trim());
      hideRejectModal();
      setSuccess(`${target.fullName}’s account was rejected.`);
      load();
    } catch (err) {
      hideRejectModal();
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function handleExport() {
    downloadCsv(view.csvName, filtered.map((u) => ({
      name: u.fullName, email: u.email, role: roleLabel(u.role),
      id_number: u.idNumber || '', program: u.program || '', section: u.section || '',
      laboratory: u.role === 'lab_custodian' ? labName(u.labId) : '',
      status: u.status || '', rejection_reason: u.rejectionReason || '',
      registered: u.createdAt || '',
    })));
  }

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  return (
    <>
      <PageHeader
        title={view.title}
        subtitle={view.lead}
        icon={view.icon}
        actions={
          <button className="btn btn-outline-secondary" onClick={handleExport} disabled={!filtered.length}>
            <i className="bi bi-download"></i> Export CSV
          </button>
        }
      />

      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="success" onClose={() => setSuccess('')}>{success}</Alert>

      {/* Nudge back to the queue whenever work is waiting and we aren't already looking at it. */}
      {statusFilter !== 'pending' && pendingCount > 0 && (
        <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>
            <i className="bi bi-hourglass-split me-1"></i>
            <strong>{pendingCount}</strong> registration{pendingCount === 1 ? '' : 's'} awaiting approval.
          </span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => updateFilter({ role: '', status: 'pending' })}>
            Review now
          </button>
        </div>
      )}

      {view.showCreateForm && (
        <div className="card mb-4">
          <PanelHeader icon="bi-person-plus" title="Create Lab Custodian / Administrator Account" />
          <div className="card-body">
            {/*
              A bare email + password pair reads as a login form to the
              browser's autofill heuristics, so without guidance here it will
              offer the ADMIN's own saved email/password — for an account
              this form is creating for someone else entirely. `off` on the
              form is the general signal; `new-password` on the password
              field is the specific one Chrome actually honors, and it also
              stops the field pairing from being read as "sign in".
            */}
            <form onSubmit={handleCreate} className="row g-3" autoComplete="off">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" autoComplete="off" placeholder="e.g. Juan Dela Cruz" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" autoComplete="off" placeholder="e.g. custodian@ssu.edu.ph" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className={form.role === 'lab_custodian' ? 'col-md-3' : 'col-md-4'}>
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, labId: '' })} required>
                  <option value="">Select role</option>
                  {ROLES.filter((r) => r.id !== 'borrower').map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
              {form.role === 'lab_custodian' && (
                <div className="col-md-3">
                  <label className="form-label">Laboratory</label>
                  <select className="form-select" value={form.labId} onChange={(e) => setForm({ ...form, labId: e.target.value })} required>
                    <option value="">Select laboratory</option>
                    {LABS.map((lab) => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={form.role === 'lab_custodian' ? 'col-md-4' : 'col-md-5'}>
                <label className="form-label">Temporary Password (min 8 chars)</label>
                <input type="password" className="form-control" autoComplete="new-password" minLength={8} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className={form.role === 'lab_custodian' ? 'col-md-2 d-flex align-items-end' : 'col-md-3 d-flex align-items-end'}>
                <button className="btn btn-primary w-100" disabled={creating}>
                  <i className="bi bi-person-plus me-1"></i> {creating ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="flex-fill" style={{ minWidth: 220 }}>
          <label className="form-label">Search</label>
          <div className="input-icon-group">
            <i className="bi bi-search input-icon"></i>
            <input
              type="search"
              className="form-control"
              placeholder="Name, email, ID, program"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="form-label">Role</label>
          {/* Scrolls horizontally instead of letting Bootstrap squeeze the
              buttons — squeezed buttons wrap their own label text, which is
              what broke this control on narrow phones. */}
          <div className="segmented-scroll">
            <div className="btn-group btn-group-sm" role="group" aria-label="Filter by role">
              <button type="button" className={`btn btn-outline-secondary ${!roleFilter ? 'active' : ''}`} onClick={() => updateFilter({ role: '' })}>All</button>
              <button type="button" className={`btn btn-outline-secondary ${roleFilter === 'lab_custodian' ? 'active' : ''}`} onClick={() => updateFilter({ role: 'lab_custodian' })}>Lab Custodians</button>
              <button type="button" className={`btn btn-outline-secondary ${roleFilter === 'borrower' ? 'active' : ''}`} onClick={() => updateFilter({ role: 'borrower' })}>Borrowers</button>
              <button type="button" className={`btn btn-outline-secondary ${roleFilter === 'admin' ? 'active' : ''}`} onClick={() => updateFilter({ role: 'admin' })}>Admins</button>
            </div>
          </div>
        </div>
        <div style={{ minWidth: 160 }}>
          <label className="form-label">Status</label>
          <select className="form-select" value={statusFilter} onChange={(e) => updateFilter({ status: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="card">
        <PanelHeader icon={view.icon} title={view.title} count={filtered.length} />
        <div className="table-responsive">
          <table className="table table-sm mb-0 align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                {showRoleColumn && <th>Role</th>}
                <th>{view.detailsHeader}</th>
                <th>Status</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className={`avatar-chip role-${u.role}`}>{initials(u.fullName)}</span>
                      <div className="d-flex flex-column lh-sm" style={{ minWidth: 0 }}>
                        <span className="fw-medium">{u.fullName}</span>
                        {u.idNumber && <span className="text-muted" style={{ fontSize: '0.74rem' }}>ID {u.idNumber}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{u.email}</td>
                  {showRoleColumn && (
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role] || 'soft-neutral'}`}>{roleLabel(u.role)}</span>
                    </td>
                  )}
                  <td>{userDetails(u)}</td>
                  <td>
                    <UserStatusBadge status={u.status} />
                    {u.status === 'rejected' && u.rejectionReason && (
                      <div className="small text-muted mt-1">Reason: {u.rejectionReason}</div>
                    )}
                  </td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="text-end text-nowrap">
                    {me && u.id !== me.uid && (
                      <>
                        {u.status !== 'approved' && (
                          <button className="btn btn-sm btn-success me-1" disabled={busyId === u.id} onClick={() => handleApprove(u)}>Approve</button>
                        )}
                        {u.status !== 'rejected' && (
                          <button className="btn btn-sm btn-outline-danger" disabled={busyId === u.id} onClick={() => openReject(u)}>Reject</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {loading && Array.from({ length: 4 }, (_, i) => (
                <tr key={`sk-${i}`}>
                  {Array.from({ length: columnCount }, (__, c) => (
                    <td key={c}><span className="skeleton" style={{ height: 12, width: c === 0 ? '70%' : '55%' }} /></td>
                  ))}
                </tr>
              ))}
              {!loading && !pageItems.length && (
                <EmptyState
                  colSpan={columnCount}
                  icon={search ? 'bi-search' : view.icon}
                  title={search ? 'No accounts match your search.' : view.empty}
                  text={search ? `Nothing found for "${search.trim()}".` : undefined}
                  action={search
                    ? <button className="btn btn-sm btn-outline-secondary" onClick={() => setSearch('')}>Clear search</button>
                    : undefined}
                />
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} total={filtered.length} />
      </div>

      <div className="modal fade" id="rejectUserModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={confirmReject}>
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <span className="panel-icon tone-danger"><i className="bi bi-x-circle"></i></span>
                  Reject Account — {rejecting?.fullName}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Reason (shown to the user)</label>
                  <textarea className="form-control" rows="3" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. School ID could not be verified" required></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={!rejecting || busyId === rejecting.id}>Reject Account</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
