import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/realApi';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadBranches = useCallback(async () => {
    const data = await api.getBranches();
    setBranches(data);
    return data;
  }, []);

  const loadProducts = useCallback(async () => {
    const data = await api.getProducts();
    setProducts(data);
    return data;
  }, []);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <AppContext.Provider value={{ branches, products, loadBranches, loadProducts, refreshTrigger, refresh }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export default AppContext;
