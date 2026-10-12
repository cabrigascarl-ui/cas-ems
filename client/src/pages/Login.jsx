import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { roleHome } from '../constants.js';
import AuthLayout from '../components/AuthLayout.jsx';
import LoginForm from '../components/LoginForm.jsx';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Already have a session (e.g. browser back/forward, a stale bookmark)?
  // Leave immediately instead of rendering the login form underneath the
  // dashboard shell, which is what Layout does whenever `user` is truthy.
  if (user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return (
    <AuthLayout>
      <LoginForm onLoggedIn={(loggedInUser) => navigate(roleHome(loggedInUser.role))} />
    </AuthLayout>
  );
}
