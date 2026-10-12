import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLoginModal } from '../context/useLoginModal.js';
import ssuLogo from '../assets/ssu-logo.jpg';
import casLogo from '../assets/cas-logo.jpg';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/policy', label: 'Policy' },
  { to: '/laboratories', label: 'Laboratories' },
  { to: '/credits', label: 'Credits' },
];

function navClass({ isActive }) {
  return 'public-nav-link' + (isActive ? ' active' : '');
}

/** Top nav shown on the public-facing pages (login/register/setup and the About/Policy/Laboratories/Credits pages). */
export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { openLoginModal } = useLoginModal();
  const location = useLocation();
  const onLoginPage = location.pathname === '/login';

  return (
    <header className="public-header">
      <div className="public-header-grid px-3 px-md-4 py-2">
        <NavLink to="/" className="public-header-brand text-decoration-none">
          <span className="d-flex align-items-center gap-1">
            <img src={ssuLogo} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
            <img src={casLogo} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
          </span>
          <span className="fw-bold text-white" style={{ fontSize: '0.95rem' }}>CAS-EMS</span>
        </NavLink>

        <div className="d-none d-md-flex align-items-center gap-2" style={{ justifySelf: 'center' }}>
          <nav className="public-nav-pill d-flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {!onLoginPage && (
            <button type="button" className="public-header-login" onClick={openLoginModal}>
              Login
            </button>
          )}
        </div>

        <button
          type="button"
          className="public-header-toggle d-md-none"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          style={{ justifySelf: 'end' }}
        >
          <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'}`}></i>
        </button>
      </div>

      {open && (
        <nav className="public-nav-mobile d-md-none d-flex flex-column">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navClass} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          {!onLoginPage && (
            <button
              type="button"
              className="public-header-login justify-content-center"
              onClick={() => { setOpen(false); openLoginModal(); }}
            >
              Login
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
