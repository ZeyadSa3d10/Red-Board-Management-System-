import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleHierarchy = {
  owner: 3,
  accountant: 2,
  staff: 1,
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const route = user.role === 'owner' ? '/owner/dashboard'
      : user.role === 'accountant' ? '/accountant/dashboard'
      : '/branch/dashboard';
    return <Navigate to={route} replace />;
  }

  return children;
};

export const getDefaultRoute = (role) => {
  const routes = {
    owner: '/owner/dashboard',
    accountant: '/accountant/dashboard',
    staff: '/branch/dashboard',
  };
  return routes[role] || '/login';
};
