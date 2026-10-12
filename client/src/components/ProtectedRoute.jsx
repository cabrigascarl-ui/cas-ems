import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';
import { roleHome } from '../constants.js';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" /></div>;
  }
  if (!user || user.status !== 'approved') {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }
  return children;
}
