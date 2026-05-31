import { useState, useEffect, useCallback } from 'react';
import api from '../api/realApi';

export const useInventory = (branchId = null) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = branchId
      ? await api.getProductsByBranch(branchId)
      : await api.getAllStock();
    setData(result);
    setLoading(false);
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
};

export const useInvoices = (filters = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await api.getInvoices(filters);
    setData(result);
    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
};

export const useReports = (branchId = null) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await api.getOwnerDashboardStats();
    setStats(result);
    setLoading(false);
  }, [branchId]);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, reload: load };
};
