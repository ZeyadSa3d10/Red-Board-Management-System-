import { useState, useEffect, useMemo } from 'react';
import api from '../../api/realApi';
import StatCard from '../../components/common/StatCard';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import { formatCurrency } from '../../utils/formatters';
import { BsTruck, BsCashCoin, BsPeople, BsBarChart, BsReceipt } from 'react-icons/bs';

const AccountantDashboard = () => {
  const [stats, setStats] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierSearch, setSupplierSearch] = useState('');

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    );
  }, [suppliers, supplierSearch]);

  useEffect(() => {
    const load = async () => {
      const [s, statsData] = await Promise.all([
        api.getSuppliers(),
        api.getOwnerDashboardStats(),
      ]);
      setSuppliers(s);
      setStats(statsData);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner-border" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2>لوحة تحكم المحاسب</h2>
      </div>

      <div className="stats-grid">
        <StatCard title="قيمة المخزون الكلي" value={stats?.totalInventoryValue || 0} icon={BsBarChart} color="primary" />
        <StatCard title="ديون العملاء" value={stats?.totalDeferredFromClients || 0} icon={BsPeople} color="danger" />
        <StatCard title="المستحق للموردين" value={stats?.totalDueToSuppliers || 0} icon={BsTruck} color="warning" />
        <StatCard title="عدد الفواتير" value={stats?.totalInvoicesCount || 0} icon={BsReceipt} color="info" />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h5 style={{ fontWeight: 600, marginBottom: 16 }}>حسابات الموردين</h5>
        <FilterBar variant="simple">
          <FilterSearch value={supplierSearch} onChange={setSupplierSearch} placeholder="بحث باسم المورد..." />
        </FilterBar>
        <table className="table-custom">
          <thead>
            <tr>
              <th>المورد</th>
              <th>إجمالي المشتريات</th>
              <th>المدفوع</th>
              <th>المستحق</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>{s.name}</td>
                <td className="mono">{formatCurrency((s.totalDue || 0) + (s.totalPaid || 0))}</td>
                <td className="mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(s.totalPaid || 0)}</td>
                <td className="mono" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{formatCurrency(s.totalDue || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountantDashboard;
