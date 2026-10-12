import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { firebaseConfigured } from '../firebase.js';
import { roleLabel, LABS, labName, labIcon } from '../constants.js';
import { errorMessage } from '../utils/errors.js';
import Alert from './Alert.jsx';
import ScanTransition from './ScanTransition.jsx';

const PRIMARY_DEMO_ACCOUNTS = [
  { email: 'admin@demo.cas-ems.local', label: 'Administrator', sub: 'Manages all accounts & labs', icon: 'bi-shield-lock', bg: 'var(--brand-50)', fg: 'var(--brand-600)' },
  { email: 'borrower@demo.cas-ems.local', label: 'Borrower', sub: 'Requests & history', icon: 'bi-person', bg: 'var(--success-bg)', fg: 'var(--success-fg)' },
];

/**
 * The actual sign-in form — shared by the full /login page (inside
 * AuthLayout) and LoginModal (the popup opened from the public header),
 * so the two surfaces can never drift out of sync.
 */
export default function LoginForm({ onLoggedIn, onRegisterLinkClick }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  async function doLogin(loginEmail, loginPassword) {
    setError('');
    setBusy(true);
    try {
      const loggedIn = await login(loginEmail, loginPassword);
      setAuthenticatedUser(loggedIn);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    doLogin(email, password);
  }

  if (authenticatedUser) {
    return (
      <ScanTransition
        successLabel={`Welcome, ${authenticatedUser.fullName?.split(' ')[0] || 'back'}`}
        subLabel={authenticatedUser.role === 'lab_custodian' ? labName(authenticatedUser.labId) : roleLabel(authenticatedUser.role)}
        onComplete={() => onLoggedIn(authenticatedUser)}
      />
    );
  }

  return (
    <>
      <h3 className="mb-1" style={{ fontSize: '1.4rem' }}>Welcome back</h3>
      <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>Log in to your CAS-EMS account.</p>

      <Alert onClose={() => setError('')}>{error}</Alert>

      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="form-label">Email</label>
          <div className="input-icon-group">
            <input type="email" className="form-control" placeholder="you@ssu.edu.ph" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            <i className="bi bi-envelope input-icon"></i>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <div className="input-icon-group">
            <input type="password" className="form-control" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <i className="bi bi-lock input-icon"></i>
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={busy}>
          {busy ? 'Logging in…' : (<>Log In <i className="bi bi-arrow-right"></i></>)}
        </button>
      </form>

      <p className="text-center small text-muted mt-3 mb-0">
        Borrower (faculty/staff/student)? <Link to="/register" onClick={onRegisterLinkClick}>Register here</Link>
      </p>

      {!firebaseConfigured && (
        <>
          <div className="auth-divider">DEMO ACCOUNTS</div>
          <p className="text-muted small mb-2" style={{ marginTop: '-0.6rem', fontSize: '0.78rem' }}>No password needed — pick a role to explore its dashboard.</p>
          <div className="d-grid gap-1 mb-3">
            {PRIMARY_DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="demo-tile"
                disabled={busy}
                onClick={() => doLogin(acc.email, 'demo')}
              >
                <span className="demo-tile-icon" style={{ background: acc.bg, color: acc.fg }}>
                  <i className={`bi ${acc.icon}`}></i>
                </span>
                <span className="demo-tile-label">
                  {acc.label}
                  <span className="d-block text-muted" style={{ fontSize: '0.72rem', fontWeight: 400 }}>{acc.sub}</span>
                </span>
                <i className="bi bi-chevron-right ms-auto text-muted"></i>
              </button>
            ))}
          </div>

          <p className="text-muted small mb-2" style={{ fontSize: '0.78rem' }}>Or log in as a lab custodian:</p>
          <div className="d-flex flex-wrap gap-1">
            {LABS.map((lab) => (
              <button
                key={lab.id}
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={busy}
                onClick={() => doLogin(`${lab.id}.lab@demo.cas-ems.local`, 'demo')}
              >
                <i className={`bi ${labIcon(lab.id)}`}></i> {lab.name.replace(' Laboratory', '')}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
