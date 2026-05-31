import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import api, { logoutApi } from '../api/realApi';
import { startConnection, stopConnection } from '../utils/signalr';

const AuthContext = createContext(null);

const getPermissions = (role) => ({
  owner: {
    canViewAllBranches: true,
    canManageSuppliers: true,
    canViewSalaries: true,
    canCreateInvoices: true,
    canManageEmployees: true,
  },
  accountant: {
    canViewAllBranches: true,
    canManageSuppliers: true,
    canViewSalaries: true,
    canCreateInvoices: false,
    canManageEmployees: false,
  },
  staff: {
    canViewAllBranches: true,
    canManageSuppliers: false,
    canViewSalaries: false,
    canCreateInvoices: true,
    canManageEmployees: false,
  },
})[role] || {};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    const result = await api.login(username, password);
    setIsLoading(false);
    if (result.success) {
      const userData = {
        ...result.user,
        permissions: getPermissions(result.user.role),
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('erp_user', JSON.stringify(userData));
      startConnection();
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('erp_user');
    logoutApi();
    stopConnection();
  }, []);

  const checkAuth = useCallback(async () => {
    const stored = localStorage.getItem('erp_user');
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        // Verify session with server
        try {
          const { http } = await import('../api/client');
          await http.get('/Auth/me');
          setUser(userData);
          setIsAuthenticated(true);
          startConnection();
        } catch {
          // Token invalid/expired, try refresh
          try {
            const refreshRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5193/api'}/Auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });
            if (refreshRes.ok) {
              setUser(userData);
              setIsAuthenticated(true);
              startConnection();
            } else {
              logout();
            }
          } catch {
            logout();
          }
        }
      } catch {
        logout();
      }
    }
    setIsInitializing(false);
  }, [logout]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, isInitializing, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
