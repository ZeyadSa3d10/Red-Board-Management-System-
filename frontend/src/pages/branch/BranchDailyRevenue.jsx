import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import StatCard from '../../components/common/StatCard';
import { formatCurrency, formatDate, getToday } from '../../utils/formatters';
import { BsCashCoin, BsReceipt, BsCartPlus, BsArrowReturnLeft, BsCreditCard, BsFileEarmarkText, BsBuilding } from 'react-icons/bs';

const BranchDailyRevenue = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || '');
  const branchId = selectedBranchId || user?.branchId;
  const noBranch = !branchId;

  useEffect(() => {
    if (!user?.branchId) {
      api.getBranches().then(setBranches).catch(() => {});
    }
  }, [user?.branchId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await api.getDailyRevenue(branchId, date);
      setData(result);
      setLoading(false);
    };
    if (branchId) load();
  }, [branchId, date]);

  if (noBranch) {
    return (
      <div>
        <div className="page-header">
          <h2>إيراد اليوم</h2>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <BsBuilding size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
          <div style={{ marginBottom: 16, color: 'var(--color-text-secondary)' }}>يرجى اختيار فرع لعرض الإيرادات</div>
          <select className="form-control w-responsive" style={{ maxWidth: 250, margin: '0 auto' }} value={selectedBranchId}
            onChange={e => setSelectedBranchId(e.target.value)}>
            <option value="">اختر الفرع</option>
            {branches.filter(b => !b.isAdminBranch).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>إيراد اليوم</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!user?.branchId && (
            <select className="form-control w-responsive" style={{ maxWidth: 200 }} value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}>
              <option value="">اختر الفرع</option>
              {branches.filter(b => !b.isAdminBranch).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <input className="form-control-custom" type="date" value={date}
            onChange={e => setDate(e.target.value)} style={{ maxWidth: 200 }} />
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : data ? (
        <>
          <div className="stats-grid">
            <StatCard title="صافي الإيراد" value={data.netRevenue} icon={BsCashCoin} color="success" />
            <StatCard title="إجمالي المبيعات" value={data.totalSales} icon={BsCartPlus} color="primary" />
            <StatCard title="المرتجعات" value={data.totalReturns} icon={BsArrowReturnLeft} color="danger" />
            <StatCard title="نقدي" value={data.cash} icon={BsCashCoin} color="info" />
            <StatCard title="فودافون كاش" value={data.vodafoneCash} icon={BsCreditCard} color="warning" />
            <StatCard title="شيكات" value={data.check} icon={BsFileEarmarkText} color="primary" />
            <StatCard title="الديون المحصلة" value={data.deferredPayments} icon={BsReceipt} color="success" />
            <StatCard title="عدد الفواتير" value={data.invoicesCount} icon={BsFileEarmarkText} color="info" />
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h5 style={{ fontWeight: 600, marginBottom: 16 }}>ملخص إيراد يوم {formatDate(date)}</h5>
            <table className="table-custom">
              <tbody>
                <tr><td>إجمالي المبيعات</td><td className="mono">{formatCurrency(data.totalSales)}</td></tr>
                <tr><td>المرتجعات</td><td className="mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(data.totalReturns)}</td></tr>
                <tr><td>الديون المحصلة</td><td className="mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(data.deferredPayments)}</td></tr>
                <tr style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  <td>صافي الإيراد</td>
                  <td className="mono" style={{ color: 'var(--color-accent)' }}>{formatCurrency(data.netRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          لا توجد بيانات لهذا اليوم
        </div>
      )}
    </div>
  );
};

export default BranchDailyRevenue;
