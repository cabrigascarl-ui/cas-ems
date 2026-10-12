import { useState } from 'react';

export default function DemoModeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="alert alert-info d-flex align-items-start gap-2 no-print mb-3">
      <i className="bi bi-info-circle-fill flex-shrink-0" style={{ marginTop: '0.1rem' }}></i>
      <div className="flex-fill">
        <strong>Demo mode</strong> — Firebase isn't connected yet, so this is running on sample data stored in your
        browser. See the login page for demo accounts, or <code>client/.env.local</code> to connect a real project.
      </div>
      <button
        type="button"
        className="btn-close flex-shrink-0"
        onClick={() => setDismissed(true)}
        aria-label="Close"
        style={{ fontSize: '0.7rem' }}
      ></button>
    </div>
  );
}
