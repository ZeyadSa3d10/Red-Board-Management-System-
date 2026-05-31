import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import StatCard from '../../components/common/StatCard';
import { getToday } from '../../utils/formatters';
import { BsCashCoin, BsReceipt, BsCartPlus, BsArrowReturnLeft, BsPeople, BsArrowClockwise, BsBuilding, BsWallet2, BsCalendarDate, BsBox } from 'react-icons/bs';

const BranchDashboard = () => {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState(null);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [supplyCount, setSupplyCount] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || '');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const branchId = selectedBranchId || user?.branchId;

  const withTimeout = (promise, ms = 8000) =>
    Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

  const load = useCallback(async (date) => {
    const targetDate = date || selectedDate;
    if (!branchId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const rev = await withTimeout(api.getDailyRevenue(branchId, targetDate), 5000).catch(() => null);
      if (rev) setRevenue(rev);
      else setError('فشل تحميل الإيرادات');
    } catch { setError('فشل تحميل الإيرادات'); }

    withTimeout(api.getProductsByBranch(branchId), 5000).then(setProducts).catch(() => {});
    withTimeout(api.getEmployeesByBranch(branchId), 5000).then(setEmployees).catch(() => {});
    withTimeout(api.getExpenses({ branchId, dateFrom: targetDate, dateTo: targetDate }), 5000).then(data => setExpenses(Array.isArray(data) ? data : (data?.items || []))).catch(() => {});
    withTimeout(api.getInvoices({ branchId, type: 'supply_installation', date: targetDate }), 5000).then(data => setSupplyCount(data?.length || data?.totalCount || 0)).catch(() => {});

    setLoading(false);
  }, [branchId, selectedDate]);

  useEffect(() => { load(); }, [branchId]);

  // Load branches list for branch selector (owner/accountant)
  useEffect(() => {
    if (!user?.branchId) {
      api.getBranches().then(setBranches).catch(() => {});
    }
  }, [user?.branchId]);

  if (loading && branchId) return <div className="loading-container"><div className="spinner-border" /></div>;

  const noBranch = !branchId;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2>لوحة تحكم الفرع</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BsCalendarDate size={16} color="var(--color-text-secondary)" />
            <input type="date" className="form-control" style={{ maxWidth: 160 }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            <button className="btn-custom btn-custom-primary btn-custom-sm" onClick={() => { setRevenue(null); setExpenses([]); setSupplyCount(0); load(selectedDate); }}>تطبيق</button>
          </div>
          {noBranch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BsBuilding size={16} color="var(--color-text-secondary)" />
              <select className="form-control w-responsive" style={{ maxWidth: 200 }} value={selectedBranchId} onChange={e => { setSelectedBranchId(e.target.value); setRevenue(null); setProducts([]); setEmployees([]); setExpenses([]); setSupplyCount(0); }}>
                <option value="">اختر الفرع</option>
                {branches.filter(b => !b.isAdminBranch).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <button className="btn-custom btn-custom-outline" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BsArrowClockwise size={16} /> تحديث
          </button>
        </div>
      </div>

      {noBranch && (
        <div style={{ background: 'var(--color-info-light)', color: 'var(--color-info)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '0.85rem' }}>
          يرجى اختيار فرع من القائمة أعلاه لعرض البيانات
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <StatCard title="إيراد اليوم" value={revenue?.netRevenue ?? 0} prefix="" icon={BsCashCoin} color="success" />
        <StatCard title="نقدي" value={revenue?.cash ?? 0} prefix="" icon={BsCashCoin} color="primary" />
        <StatCard title="فودافون كاش" value={revenue?.vodafoneCash ?? 0} prefix="" icon={BsReceipt} color="info" />
        <StatCard title="شيكات" value={revenue?.check ?? 0} prefix="" icon={BsReceipt} color="warning" />
        <StatCard title="تحويل بنكي" value={revenue?.bankTransfer ?? 0} prefix="" icon={BsReceipt} color="secondary" />
        <StatCard title="المبيعات" value={revenue?.totalSales ?? 0} prefix="" icon={BsCartPlus} color="primary" />
        <StatCard title="المرتجعات" value={revenue?.totalReturns ?? 0} prefix="" icon={BsArrowReturnLeft} color="danger" />
        <StatCard title="عدد الفواتير" value={revenue?.invoicesCount ?? 0} icon={BsReceipt} color="info" />
        <StatCard title="توريد وتركيب" value={supplyCount} icon={BsBox} color="warning" />
        <StatCard title="الديون المحصلة" value={revenue?.deferredPayments ?? 0} prefix="" icon={BsPeople} color="success" />
        <StatCard title="المصروفات" value={totalExpenses} prefix="" icon={BsWallet2} color="danger" />
        <StatCard title="الصافي" value={(revenue?.netRevenue ?? 0) - totalExpenses} prefix="" icon={BsCashCoin} color="success" />
      </div>

        {expenses.length > 0 && (
          <div className="card" style={{ padding: 20, marginTop: 20 }}>
            <h3 style={{ marginBottom: 15, fontSize: '1.1rem', fontWeight: 600 }}>مصروفات {selectedDate}</h3>
            <table className="table-custom">
              <thead>
                <tr>
                  <th>البيان</th>
                  <th>المبلغ</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td>{exp.description}</td>
                    <td>{exp.amount}</td>
                    <td>{exp.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
};

export default BranchDashboard;
