import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roleHome } from '../constants.js';
import { useLoginModal } from '../context/useLoginModal.js';
import LoginForm from './LoginForm.jsx';

/** Popup version of the sign-in form, opened from the "Login" button in the
 * public header without leaving the page underneath. /login itself still
 * works as a full page for direct links and redirects. */
export default function LoginModal() {
  const { isOpen, closeLoginModal } = useLoginModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeLoginModal(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeLoginModal]);

  if (!isOpen) return null;

  function handleLoggedIn(loggedInUser) {
    closeLoginModal();
    navigate(roleHome(loggedInUser.role));
  }

  return (
    <div className="login-modal-backdrop" onMouseDown={closeLoginModal}>
      <div className="login-modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="login-modal-close" onClick={closeLoginModal} aria-label="Close">
          <i className="bi bi-x-lg"></i>
        </button>
        <LoginForm onLoggedIn={handleLoggedIn} onRegisterLinkClick={closeLoginModal} />
      </div>
    </div>
  );
}
