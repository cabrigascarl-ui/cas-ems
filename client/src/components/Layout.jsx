import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { firebaseConfigured } from '../firebase.js';
import { roleHome, roleLabel, labName } from '../constants.js';
import DemoModeBanner from './DemoModeBanner.jsx';
import ssuLogo from '../assets/ssu-logo.jpg';
import casLogo from '../assets/cas-logo.jpg';

const SIDEBAR_GROUPS = {
  admin: [
    {
      items: [
        ['/admin/dashboard', 'Dashboard', 'bi-speedometer2'],
        ['/admin/laboratories', 'Laboratories', 'bi-buildings'],
      ],
    },
    {
      title: 'Accounts',
      items: [
        ['/admin/users', 'Manage Users', 'bi-people'],
        ['/admin/users?role=borrower', 'Borrowers', 'bi-person'],
        ['/admin/users?status=pending', 'Pending Registrations', 'bi-hourglass-split'],
      ],
    },
    {
      title: 'Inventory',
      items: [
        ['/admin/inventory', 'Total Registered Items', 'bi-boxes'],
        ['/admin/inventory?flag=expiring', 'Expiring & Expired Items', 'bi-exclamation-triangle'],
        ['/admin/inventory?flag=lowStock', 'Low Stock Items', 'bi-graph-down-arrow'],
      ],
    },
    {
      title: 'System',
      items: [
        ['/admin/activity-logs', 'Activity Logs', 'bi-clock-history'],
      ],
    },
  ],
  lab_custodian: [
    { items: [['/lab/dashboard', 'Dashboard', 'bi-speedometer2']] },
    { title: 'Inventory', items: [['/lab/equipment', 'Equipment & Supplies', 'bi-box-seam']] },
    {
      title: 'Transactions',
      items: [
        ['/lab/requests', 'Requests', 'bi-inbox'],
        ['/lab/release', 'Release Equipment', 'bi-box-arrow-up'],
        ['/lab/return', 'Return Equipment', 'bi-box-arrow-in-down'],
      ],
    },
    {
      title: 'Records',
      items: [
        ['/lab/maintenance', 'Maintenance', 'bi-tools'],
        ['/lab/reports', 'Reports', 'bi-file-earmark-bar-graph'],
      ],
    },
  ],
  borrower: [
    {
      items: [
        ['/borrower/dashboard', 'Dashboard', 'bi-speedometer2'],
        ['/borrower/request', 'New Request', 'bi-plus-square'],
        ['/borrower/history', 'My Transactions', 'bi-clock-history'],
      ],
    },
  ],
};

const AUTH_ROUTES = ['/login', '/register', '/setup', '/about', '/policy', '/laboratories', '/credits'];

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
}

/**
 * Several sidebar entries point at the same page with different query
 * filters (e.g. "Manage Users" vs "Borrowers" both render AdminUsers).
 * NavLink's default isActive only looks at the pathname, so it would light
 * up all of them at once — this compares the full path+query instead, and
 * treats a query-less link as active only when there's no query at all.
 */
function isLinkActive(href, location) {
  const [path, query] = href.split('?');
  if (path !== location.pathname) return false;
  return query ? location.search === `?${query}` : !location.search;
}

function SealPair({ size = 28 }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    objectFit: 'cover',
    boxShadow: '0 2px 8px rgba(0,0,0,0.45), 0 0 0 1.5px rgba(255,255,255,0.14)',
  };
  return (
    <span className="d-inline-flex align-items-center gap-1">
      <img src={ssuLogo} alt="" style={style} />
      <img src={casLogo} alt="" style={style} />
    </span>
  );
}

export default function Layout({ children }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const groups = user ? SIDEBAR_GROUPS[user.role] || [] : [];

  // The mobile drawer is an overlay, so navigating away has to close it.
  useEffect(() => { setNavOpen(false); }, [location.pathname, location.search]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Auth pages own the full viewport for a distraction-free, branded layout.
  if (!user && AUTH_ROUTES.includes(location.pathname)) {
    return children;
  }

  // While auth is still resolving (checking a stored session, fetching the
  // user's profile), `user` is momentarily null — without this, the shell
  // below renders with the hamburger/logout hidden and no sidebar at all,
  // which reads as a blank/broken page rather than a loading state.
  if (loading) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center gap-3"
        style={{ minHeight: '100vh', background: 'var(--gray-950)' }}
      >
        <SealPair size={40} />
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="navbar navbar-dark bg-dark px-3">
        <div className="d-flex align-items-center gap-2">
          {user && (
            <button
              type="button"
              className="btn btn-sm btn-outline-light sidebar-toggle d-lg-none"
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={navOpen}
            >
              <i className={`bi ${navOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
            </button>
          )}
          <a className="navbar-brand m-0" href={user ? roleHome(user.role) : '/login'}>
            <SealPair />
            <span className="d-flex flex-column lh-1">
              <span>CAS-EMS</span>
              <span
                className="d-none d-sm-block text-white-50"
                style={{ fontSize: '0.58rem', letterSpacing: '0.11em', fontWeight: 600, marginTop: 3 }}
              >
                SAMAR STATE UNIVERSITY
              </span>
            </span>
          </a>
        </div>

        {user && (
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            <span className="d-none d-sm-flex align-items-center gap-2 text-light">
              <span className="avatar-chip">{initials(user.fullName)}</span>
              <span className="d-flex flex-column lh-sm text-truncate" style={{ maxWidth: 190 }}>
                <span className="text-truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.fullName}</span>
                <span className="text-white-50 text-truncate" style={{ fontSize: '0.72rem' }}>
                  {user.role === 'lab_custodian' ? labName(user.labId) : roleLabel(user.role)}
                </span>
              </span>
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        )}
      </nav>

      <div className="d-flex">
        {user && navOpen && (
          <div className="sidebar-scrim d-lg-none" onClick={() => setNavOpen(false)} aria-hidden="true" />
        )}

        {user && (
          <nav className={`sidebar p-3${navOpen ? ' is-open' : ''}`}>
            {user.role === 'lab_custodian' && (
              <div className="sidebar-lab-card mb-3">
                <div
                  className="text-uppercase"
                  style={{ fontSize: '0.62rem', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--accent-400)' }}
                >
                  Your Laboratory
                </div>
                <div className="text-white fw-semibold" style={{ fontSize: '0.9rem' }}>{labName(user.labId)}</div>
              </div>
            )}

            {groups.map((group, gi) => (
              <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
                {group.title && <div className="sidebar-section-label">{group.title}</div>}
                <ul className="nav nav-pills flex-column gap-1">
                  {group.items.map(([href, label, icon]) => (
                    <li className="nav-item" key={href}>
                      <Link to={href} className={'nav-link' + (isLinkActive(href, location) ? ' active' : '')}>
                        <i className={`bi ${icon}`}></i> {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        )}

        <main className="flex-fill p-4">
          {!firebaseConfigured && <DemoModeBanner />}
          {/*
            Keyed on the pathname only — not the full location — so navigating
            to a different section still replays the entrance animation, but
            an in-page filter click (Users' Role/Status pills, Inventory's
            dropdowns) doesn't. Those write to the query string via
            setSearchParams, and keying on location.search here would remount
            the whole page component on every click: the loaded list would
            flash back to a loading skeleton, refetch from scratch, and drop
            whatever the admin had typed into Search.
          */}
          <div key={location.pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
