import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import StatCard from '../../components/common/StatCard';
import { formatCurrency, formatDate, formatInvoiceType, formatPaymentMethod, getToday } from '../../utils/formatters';
import { BsCashCoin, BsReceipt, BsCartPlus, BsArrowReturnLeft, BsCreditCard, BsFileEarmarkText, BsBuilding, BsWallet2, BsBox, BsArrowLeftRight } from 'react-icons/bs';

const BranchDailyRevenue = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId || '');
  const branchId = selectedBranchId || user?.branchId;
  const noBranch = !branchId;
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const supplyCount = invoices.filter(inv => inv.type === 'supply_installation').length;

  useEffect(() => {
    if (!user?.branchId) {
      api.getBranches().then(setBranches).catch(() => {});
    }
  }, [user?.branchId]);

  const loadData = useCallback(async (targetDate) => {
    setLoading(true);
    const [result, expData, invData] = await Promise.all([
      api.getDailyRevenue(branchId, targetDate),
      api.getExpenses({ branchId, dateFrom: targetDate, dateTo: targetDate }),
      api.getInvoices({ branchId, dateFrom: targetDate, dateTo: targetDate, pageSize: 200 }),
    ]);
    setData(result);
    setExpenses(Array.isArray(expData) ? expData : (expData?.items || []));
    setInvoices(Array.isArray(invData) ? invData : (invData?.items || []));
    setLoading(false);
  }, [branchId]);

  useEffect(() => {
    if (branchId) loadData(date);
  }, [branchId]);

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

  let body;
  if (loading) {
    body = <div className="loading-container"><div className="spinner-border" /></div>;
  } else if (!data) {
    body = <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
      لا توجد بيانات لهذا اليوم
    </div>;
  } else {
    body = <div>
      <div className="stats-grid">
        <StatCard title="صافي الإيراد" value={data.netRevenue} icon={BsCashCoin} color="success" />
        <StatCard title="إجمالي المبيعات" value={data.totalSales} icon={BsCartPlus} color="primary" />
        <StatCard title="المرتجعات" value={data.totalReturns} icon={BsArrowReturnLeft} color="danger" />
        <StatCard title="نقدي" value={data.cash} icon={BsCashCoin} color="info" />
        <StatCard title="فودافون كاش" value={data.vodafoneCash} icon={BsCreditCard} color="warning" />
        <StatCard title="شيكات" value={data.check} icon={BsFileEarmarkText} color="primary" />
        <StatCard title="تحويل بنكي" value={data.bankTransfer || 0} icon={BsArrowLeftRight} color="secondary" />
        <StatCard title="توريد وتركيب" value={supplyCount} icon={BsBox} color="warning" />
        <StatCard title="الديون المحصلة" value={data.deferredPayments} icon={BsReceipt} color="success" />
        <StatCard title="عدد الفواتير" value={data.invoicesCount} icon={BsFileEarmarkText} color="info" />
        <StatCard title="المصروفات" value={totalExpenses} icon={BsWallet2} color="danger" />
        <StatCard title="الصافي بعد المصروفات" value={data.netRevenue - totalExpenses} icon={BsCashCoin} color="success" />
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h5 style={{ fontWeight: 600, marginBottom: 16 }}>ملخص إيراد يوم {formatDate(date)}</h5>
        <table className="table-custom">
          <tbody>
            <tr><td>إجمالي المبيعات</td><td className="mono">{formatCurrency(data.totalSales)}</td></tr>
            <tr><td>المرتجعات</td><td className="mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(data.totalReturns)}</td></tr>
            <tr><td>الديون المحصلة</td><td className="mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(data.deferredPayments)}</td></tr>
            <tr><td>المصروفات</td><td className="mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(totalExpenses)}</td></tr>
            <tr><td>توريد وتركيب</td><td className="mono">{supplyCount} فاتورة</td></tr>
            <tr style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              <td>صافي الإيراد</td>
              <td className="mono" style={{ color: 'var(--color-accent)' }}>{formatCurrency(data.netRevenue)}</td>
            </tr>
            <tr style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              <td>الصافي بعد المصروفات</td>
              <td className="mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(data.netRevenue - totalExpenses)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {expenses.length > 0 && (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <h5 style={{ fontWeight: 600, marginBottom: 16 }}>مصروفات {formatDate(date)}</h5>
          <table className="table-custom">
            <thead>
              <tr><th>البيان</th><th>المبلغ</th><th>ملاحظات</th></tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td>{exp.description}</td>
                  <td className="mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{exp.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invoices.length > 0 && (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <h5 style={{ fontWeight: 600, marginBottom: 16 }}>معاملات يوم {formatDate(date)}</h5>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-custom">
              <thead>
                <tr>
                  <th>#</th>
                  <th>رقم الفاتورة</th>
                  <th>النوع</th>
                  <th>طريقة الدفع</th>
                  <th>العميل</th>
                  <th>الإجمالي</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{inv.invoiceNumber}</td>
                    <td>{formatInvoiceType(inv.type)}</td>
                    <td>{inv.paymentMethod ? formatPaymentMethod(inv.paymentMethod) : '—'}</td>
                    <td>{inv.clientName || '—'}</td>
                    <td className="mono">{formatCurrency(inv.totalAmount)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDate(inv.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>;
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
          <button className="btn-custom btn-custom-primary btn-custom-sm" onClick={() => loadData(date)}>تطبيق</button>
        </div>
      </div>

      {body}
    </div>
  );
};

export default BranchDailyRevenue;
