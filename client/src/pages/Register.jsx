import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { roleHome } from '../constants.js';
import { registerBorrower } from '../services/auth.js';
import { errorMessage } from '../utils/errors.js';
import Alert from '../components/Alert.jsx';
import AuthLayout from '../components/AuthLayout.jsx';

const initialForm = {
  fullName: '', idNumber: '', email: '', program: '', section: '',
  password: '', confirmPassword: '', consent: false,
};

const programs = [
  'BS Information Systems',
  'BS Information Technology',
  'BS Psychology',
  'BS Statistics',
];

export default function Register() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await registerBorrower(form);
      setSuccess(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // Already have a session? Registration is only for new borrowers.
  if (user && !success) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return (
    <AuthLayout wide>
      {success ? (
        <>
          <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--success-bg)', color: 'var(--success-fg)', fontSize: '1.4rem' }}>
            <i className="bi bi-check-lg"></i>
          </div>
          <h3 className="mb-2">Registration submitted</h3>
          <p className="text-muted mb-4">
            Your account is <strong>pending approval</strong> by the Administrator. You'll be able to log in once approved.
          </p>
          <Link to="/login" className="btn btn-primary">Back to Login</Link>
        </>
      ) : (
        <>
          <div className="auth-brand-badge auth-brand-badge--sm mb-3">
            <i className="bi bi-person-plus"></i>
          </div>
          <h3 className="mb-1" style={{ fontSize: '1.4rem' }}>Borrower registration</h3>
          <p className="text-muted mb-3" style={{ fontSize: '0.85rem' }}>For faculty, staff, and students of the College of Arts and Sciences.</p>

          <Alert onClose={() => setError('')}>{error}</Alert>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">School/Employee ID Number</label>
                <input type="text" className="form-control" value={form.idNumber} onChange={(e) => update('idNumber', e.target.value)} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Email *</label>
              <input type="email" className="form-control" value={form.email} onChange={(e) => update('email', e.target.value)} required />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="program">Program</label>
                <select id="program" className="form-select" value={form.program} onChange={(e) => update('program', e.target.value)}>
                  <option value="">Select a program (optional)</option>
                  {programs.map((program) => <option key={program} value={program}>{program}</option>)}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Section</label>
                <input type="text" className="form-control" value={form.section} onChange={(e) => update('section', e.target.value)} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Password *</label>
                <input type="password" className="form-control" minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Confirm Password *</label>
                <input type="password" className="form-control" minLength={8} value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
              </div>
            </div>
            <div className="form-check mb-4">
              <input className="form-check-input" type="checkbox" id="consent" checked={form.consent} onChange={(e) => update('consent', e.target.checked)} required />
              <label className="form-check-label small text-muted" htmlFor="consent">
                I consent to the collection and processing of my personal data for the purpose of equipment
                borrowing and accountability tracking, in accordance with the Data Privacy Act of 2012 (RA 10173).
              </label>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit Registration'}
            </button>
          </form>
          <p className="text-center small text-muted mt-4 mb-0">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
