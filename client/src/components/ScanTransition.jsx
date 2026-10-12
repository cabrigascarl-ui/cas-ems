import { useEffect, useState } from 'react';
import AnimatedBackdrop from './AnimatedBackdrop.jsx';

/**
 * Full-screen "access granted" transition shown right after a successful
 * login, before landing on the role's dashboard — echoes the same visual
 * language as the login screen (animated backdrop, corner brackets, scan
 * line) instead of an abrupt instant redirect.
 */
export default function ScanTransition({ scanningLabel = 'Verifying access…', successLabel = 'Access granted', subLabel, onComplete }) {
  const [phase, setPhase] = useState('scanning'); // scanning -> success -> exiting

  useEffect(() => {
    const toSuccess = setTimeout(() => setPhase('success'), 1000);
    const toExit = setTimeout(() => setPhase('exiting'), 1750);
    const finish = setTimeout(() => onComplete?.(), 2150);
    return () => {
      clearTimeout(toSuccess);
      clearTimeout(toExit);
      clearTimeout(finish);
    };
  }, [onComplete]);

  return (
    <div className={`scan-transition-overlay${phase === 'exiting' ? ' is-exiting' : ''}`}>
      <AnimatedBackdrop />

      <div key={phase === 'exiting' ? 'success' : phase} className="scan-phase scan-phase-enter" style={{ zIndex: 1 }}>
        {phase === 'scanning' ? (
          <div style={{ position: 'relative', width: 140, height: 140 }}>
            <div className="scan-ping-ring" aria-hidden="true" />
            <div className="scan-ping-ring scan-ping-ring--2" aria-hidden="true" />
            <div className="auth-qr-glow" aria-hidden="true" />
            <div className="auth-qr-card" style={{ width: 140, height: 140, padding: 14 }}>
              <div className="auth-qr-corner auth-qr-corner--tl" aria-hidden="true" />
              <div className="auth-qr-corner auth-qr-corner--tr" aria-hidden="true" />
              <div className="auth-qr-corner auth-qr-corner--bl" aria-hidden="true" />
              <div className="auth-qr-corner auth-qr-corner--br" aria-hidden="true" />
              <div className="auth-qr-scanline" aria-hidden="true" />
              <div className="d-flex align-items-center justify-content-center h-100" style={{ background: '#fff', borderRadius: 10 }}>
                <i className="bi bi-shield-check" style={{ fontSize: 48, color: 'var(--brand-700)' }}></i>
              </div>
            </div>
          </div>
        ) : (
          <div className="scan-transition-check">
            <div className="scan-success-burst" aria-hidden="true" />
            <div className="scan-success-burst scan-success-burst--2" aria-hidden="true" />
            <i className="bi bi-check-lg"></i>
          </div>
        )}

        <div className="text-center">
          <p className="scan-transition-label mb-0">{phase === 'scanning' ? scanningLabel : successLabel}</p>
          {subLabel && <p className="scan-transition-sub">{subLabel}</p>}
        </div>
      </div>

      <div className="scan-transition-brand" style={{ zIndex: 1 }}>
        <i className="bi bi-qr-code-scan"></i> CAS-EMS
      </div>
    </div>
  );
}
