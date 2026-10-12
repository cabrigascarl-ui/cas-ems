import { firebaseConfigured } from '../firebase.js';
import { LABS, labIcon } from '../constants.js';
import AnimatedBackdrop from './AnimatedBackdrop.jsx';
import PublicHeader from './PublicHeader.jsx';
import ssuLogo from '../assets/ssu-logo.jpg';
import casLogo from '../assets/cas-logo.jpg';
import ssuPhoto from '../assets/ssu-photo.png';

const FEATURES = [
  { icon: 'bi-buildings', text: 'Six laboratories, each with its own equipment and supply inventory.' },
  { icon: 'bi-droplet-half', text: 'Tracks one-time-use supplies with live stock counts and expiration alerts.' },
  { icon: 'bi-clipboard-check', text: 'Every borrow, return, and issuance is logged by the lab custodian in charge.' },
];

function SealLogo({ src, alt, size = 68 }) {
  return (
    <span
      className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: size, height: size, borderRadius: '50%',
        boxShadow: '0 10px 24px rgba(0,0,0,0.4)',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
      />
    </span>
  );
}

export default function AuthLayout({ children, wide = false }) {
  return (
    <div
      className="d-flex flex-column"
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `linear-gradient(155deg, rgba(49,46,129,0.90) 0%, rgba(8,13,26,0.94) 78%), url(${ssuPhoto})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <AnimatedBackdrop />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <PublicHeader />
      </div>

      <div className="d-flex flex-fill">
        <div
          className="d-none d-lg-flex flex-column justify-content-between text-white p-5"
          style={{ width: '46%', position: 'relative', zIndex: 1 }}
        >
          <div>
            <div className="d-flex align-items-center gap-3 mb-5">
              <div className="d-flex align-items-center gap-2">
                <SealLogo src={ssuLogo} alt="Samar State University seal" />
                <SealLogo src={casLogo} alt="College of Arts and Sciences seal" />
              </div>
              <div className="d-flex flex-column">
                <span className="fw-bold fs-5 lh-sm">CAS-EMS</span>
                <span className="text-white-50" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>SAMAR STATE UNIVERSITY</span>
              </div>
            </div>

            <h2 className="text-white mb-3" style={{ fontSize: '2rem', lineHeight: 1.25 }}>
              Manage equipment across all six labs
            </h2>
            <p className="text-white-50 mb-4" style={{ maxWidth: 420, fontSize: '0.95rem' }}>
              Each lab handles its own equipment and supplies. Just send a request, and
              the lab custodian takes care of approval, release, and return.
            </p>

            <div className="row row-cols-3 g-2 mb-4" style={{ maxWidth: 420 }}>
              {LABS.map((lab) => (
                <div className="col" key={lab.id}>
                  <div
                    className="d-flex align-items-center gap-2 px-2 py-2"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                  >
                    <i className={`bi ${labIcon(lab.id)}`} style={{ color: 'var(--accent-500)', fontSize: '0.95rem' }}></i>
                    <span className="text-white-50" style={{ fontSize: '0.72rem', lineHeight: 1.2 }}>{lab.name.replace(' Laboratory', '')}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="d-flex flex-column gap-3 mt-5">
              {FEATURES.map((f) => (
                <div className="d-flex align-items-start gap-3" key={f.text}>
                  <span
                    className="d-inline-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <i className={`bi ${f.icon}`}></i>
                  </span>
                  <span className="text-white-50 small pt-1">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-white-50 small">
            <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', marginBottom: '1rem' }} />
            College of Arts and Sciences &middot; Samar State University
            <div className="text-white-50" style={{ fontSize: '0.72rem', opacity: 0.7 }}>
              SSU chartered 1912 &middot; CAS established 1982
            </div>
            {!firebaseConfigured && (
              <div className="mt-3">
                <span className="badge" style={{ background: 'rgba(212,160,23,0.18)', color: '#f5d67a' }}>
                  <i className="bi bi-flask"></i> Demo Mode — sample data only
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-fill d-flex align-items-center justify-content-center p-3 p-md-5" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ width: '100%', maxWidth: wide ? 600 : 460 }}>
            <div className="d-lg-none d-flex align-items-center gap-2 mb-3">
              <SealLogo src={ssuLogo} alt="Samar State University seal" size={40} />
              <SealLogo src={casLogo} alt="College of Arts and Sciences seal" size={40} />
              <span className="fw-bold ms-1 text-white" style={{ fontSize: '1.05rem' }}>CAS-EMS</span>
            </div>

            <div
              className="bg-white p-4 p-md-5"
              style={{
                borderRadius: 'var(--r-xl)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
