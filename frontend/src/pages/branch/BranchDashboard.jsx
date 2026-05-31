import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import { formatRole, getToday } from '../../utils/formatters';
import { BsCashCoin, BsReceipt, BsCartPlus, BsArrowReturnLeft, BsPeople, BsArrowClockwise, BsBuilding, BsWallet2, BsCalendarDate } from 'react-icons/bs';

const BranchDashboard = () => {
  const { user } = useAuth();
  const [revenue, setRevenue] = useState(null);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || '');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const branchId = selectedBranchId || user?.branchId;

  const withTimeout = (promise, ms = 8000) =>
    Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

  const load = useCallback(async () => {
    if (!branchId) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const rev = await withTimeout(api.getDailyRevenue(branchId, selectedDate), 5000).catch(() => null);
      if (rev) setRevenue(rev);
      else setError('فشل تحميل الإيرادات');
    } catch { setError('فشل تحميل الإيرادات'); }

    withTimeout(api.getProductsByBranch(branchId), 5000).then(setProducts).catch(() => {});
    withTimeout(api.getEmployeesByBranch(branchId), 5000).then(setEmployees).catch(() => {});
    withTimeout(api.getExpenses({ branchId, dateFrom: selectedDate, dateTo: selectedDate }), 5000).then(data => setExpenses(Array.isArray(data) ? data : (data?.items || []))).catch(() => {});

    setLoading(false);
  }, [branchId, selectedDate]);

  useEffect(() => { load(); }, [load]);

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
            <input type="date" className="form-control" style={{ maxWidth: 160 }} value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setRevenue(null); setExpenses([]); }} />
          </div>
          {noBranch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BsBuilding size={16} color="var(--color-text-secondary)" />
              <select className="form-control w-responsive" style={{ maxWidth: 200 }} value={selectedBranchId} onChange={e => { setSelectedBranchId(e.target.value); setRevenue(null); setProducts([]); setEmployees([]); setExpenses([]); }}>
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
        <StatCard title="المبيعات" value={revenue?.totalSales ?? 0} prefix="" icon={BsCartPlus} color="primary" />
        <StatCard title="المرتجعات" value={revenue?.totalReturns ?? 0} prefix="" icon={BsArrowReturnLeft} color="danger" />
        <StatCard title="عدد الفواتير" value={revenue?.invoicesCount ?? 0} icon={BsReceipt} color="info" />
        <StatCard title="الديون المحصلة" value={revenue?.deferredPayments ?? 0} prefix="" icon={BsPeople} color="success" />
        <StatCard title="المصروفات" value={totalExpenses} prefix="" icon={BsWallet2} color="danger" />
        <StatCard title="الصافي" value={(revenue?.netRevenue ?? 0) - totalExpenses} prefix="" icon={BsCashCoin} color="success" />
        <StatCard title="موظفي الفرع" value={`${employees.filter(e => e.isActive).length} / ${employees.length}`} icon={BsPeople} color="info" />
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
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <h3 style={{ marginBottom: 15, fontSize: '1.1rem', fontWeight: 600 }}>موظفو الفرع</h3>
          <table className="table-custom">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الدور</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 5).map(emp => (
                <tr key={emp.id}>
                  <td>{emp.fullName || emp.name}</td>
                  <td>{formatRole(emp.role)}</td>
                  <td><Badge label={emp.isActive ? 'نشط' : 'غير نشط'} color={emp.isActive ? 'success' : 'danger'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length > 5 && (
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <button className="btn-link" onClick={() => window.location.href = '/branch/employees'}>عرض الكل</button>
            </div>
          )}
        </div>
      </div>
  );
};

export default BranchDashboard;
