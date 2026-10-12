import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { roleHome } from '../constants.js';
import { checkAdminExists, createFirstAdmin } from '../services/auth.js';
import { errorMessage } from '../utils/errors.js';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';

export default function Setup() {
  const { user } = useAuth();
  const [adminExists, setAdminExists] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    checkAdminExists().then(setAdminExists).catch(() => setAdminExists(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await createFirstAdmin(form);
      if (result?.verificationPending) setVerificationPending(true);
      else setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (user && !done) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return (
    <AuthLayout>
      <div className="auth-brand-badge auth-brand-badge--sm mb-3">
        <i className="bi bi-shield-lock"></i>
      </div>
      <h3 className="mb-1" style={{ fontSize: '1.4rem' }}>Initial setup</h3>
      {adminExists === null ? (
        <p className="text-muted">Checking…</p>
      ) : done ? (
        <>
          <p className="text-muted mb-4">Administrator account created.</p>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </>
      ) : adminExists ? (
        <>
          <p className="text-muted mb-4">An administrator account already exists.</p>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </>
      ) : (
        <>
          <p className="text-muted mb-4">
            {verificationPending
              ? 'Check your email and open the verification link. Then submit this form again with the same password to finish setup.'
              : 'Create the first System Administrator account. You will verify your email before setup is complete.'}
          </p>
          <Alert onClose={() => setError('')}>{error}</Alert>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={busy}>
              {busy ? 'Please wait…' : verificationPending ? 'Complete Setup' : 'Create Administrator'}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
