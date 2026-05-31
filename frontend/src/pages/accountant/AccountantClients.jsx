import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate, formatInvoiceStatus, getToday } from '../../utils/formatters';
import { useNotifications } from '../../context/NotificationContext';
import Badge from '../../components/common/Badge';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import { BsCashCoin, BsExclamationTriangle, BsPeople } from 'react-icons/bs';

const AccountantClients = () => {
  const { addNotification } = useNotifications();
  const [clients, setClients] = useState([]);
  const [deferredInvoices, setDeferredInvoices] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [selectedDi, setSelectedDi] = useState(null);
  const [loading, setLoading] = useState(true);
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '' });

  const load = async () => {
    setLoading(true);
    const [c, di] = await Promise.all([api.getClients(), api.getInvoices()]);
    setClients(c);
    setDeferredInvoices(di.filter(i => i.type === 'sale_deferred'));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getClientDeferred = (clientId) => deferredInvoices.filter(i => i.clientId === clientId);

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      addNotification('يرجى إدخال مبلغ صحيح', 'danger');
      return;
    }
    await api.addClientPayment(selectedClient.id, {
      deferredInvoiceId: selectedDi,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      date: getToday(),
      notes: '',
    });
    addNotification('تم تسجيل الدفعة', 'success');
    setShowPayment(false);
    setPayAmount('');
    load();
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(filters.search.toLowerCase())
  );

  const totalDeferred = clients.reduce((s, c) => s + c.totalDeferred, 0);
  const totalCreditLimit = clients.reduce((s, c) => s + c.creditLimit, 0);
  const atRisk = clients.filter(c => c.creditLimit > 0 && c.totalDeferred >= c.creditLimit * 0.8);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>حسابات العملاء</h2>
          <div className="page-subtitle">إدارة ديون العملاء وتسديد الدفعات</div>
        </div>
      </div>
      <FilterBar variant="simple" onReset={resetFilters} activeCount={activeCount}>
        <FilterSearch value={filters.search} onChange={v => setFilter('search', v)} placeholder="بحث بالاسم..." />
      </FilterBar>

      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="card card-clickable" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BsPeople size={22} color="#DC2626" />
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 500 }}>إجمالي الديون</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#DC2626', fontFamily: 'var(--font-numbers)', lineHeight: 1.2 }}>{formatCurrency(totalDeferred)}</div>
            </div>
            <div className="card card-clickable" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BsCashCoin size={22} color="#2563EB" />
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 500 }}>إجمالي الحد الائتماني</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#1E3A5F', fontFamily: 'var(--font-numbers)', lineHeight: 1.2 }}>{formatCurrency(totalCreditLimit)}</div>
            </div>
            <div className="card card-clickable" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BsExclamationTriangle size={22} color="#D97706" />
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 4, fontWeight: 500 }}>عملاء تجاوزوا 80%</div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: '#D97706', fontFamily: 'var(--font-numbers)', lineHeight: 1.2 }}>{atRisk.length}</div>
            </div>
          </div>

          {atRisk.map(c => (
            <div key={c.id} className="card" style={{
              padding: '12px 16px', marginBottom: 8, borderRight: '4px solid #F59E0B',
              display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem',
            }}>
              <BsExclamationTriangle size={18} color="#D97706" />
              <strong>{c.name}</strong>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                وصل إلى {Math.round((c.totalDeferred / c.creditLimit) * 100)}% من الحد الائتماني ({formatCurrency(c.totalDeferred)} من {formatCurrency(c.creditLimit)})
              </span>
            </div>
          ))}

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>رقم الهاتف</th>
                  <th>النوع</th>
                  <th>إجمالي الديون</th>
                  <th>الحد الائتماني</th>
                  <th>الاستخدام</th>
                  <th>عدد الفواتير</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const usagePct = c.creditLimit > 0 ? Math.round((c.totalDeferred / c.creditLimit) * 100) : 0;
                  const overLimit = c.totalDeferred > c.creditLimit && c.creditLimit > 0;
                  const isSelected = selectedClient?.id === c.id;
                  return (
                    <tr key={c.id} className={isSelected ? 'selected' : ''}
                      onClick={() => setSelectedClient(c)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td>{c.phone}</td>
                      <td><Badge label={c.isCompany ? 'شركة' : 'فرد'} color={c.isCompany ? 'info' : 'secondary'} /></td>
                      <td className="mono" style={{ fontWeight: 600, color: overLimit ? 'var(--color-danger)' : c.totalDeferred > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}>
                        {formatCurrency(c.totalDeferred)}
                      </td>
                      <td className="mono">{c.creditLimit > 0 ? formatCurrency(c.creditLimit) : '—'}</td>
                      <td>
                        {c.creditLimit > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 6, background: 'var(--color-bg-alt)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(usagePct, 100)}%`, background: usagePct >= 80 ? 'var(--color-danger)' : usagePct >= 50 ? 'var(--color-warning)' : 'var(--color-success)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, color: usagePct >= 80 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>{usagePct}%</span>
                          </div>
                        ) : <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td>{getClientDeferred(c.id).length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {selectedClient && (
            <div className="card" style={{ marginTop: 20 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-light)' }}>
                <h5 style={{ fontWeight: 600, margin: 0 }}>فواتير {selectedClient.name} الآجلة</h5>
              </div>
              <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>الفرع</th>
                    <th>المبلغ الأصلي</th>
                    <th>المدفوع</th>
                    <th>المتبقي</th>
                    <th>تاريخ الاستحقاق</th>
                    <th>الحالة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {getClientDeferred(selectedClient.id).map(di => {
                    const status = formatInvoiceStatus(di.status || 'unpaid');
                    const remaining = di.totalAmount - (di.paidAmount || 0);
                    return (
                      <tr key={di.id}>
                        <td>{di.id}</td>
                        <td>{di.branchId}</td>
                        <td className="mono">{formatCurrency(di.totalAmount)}</td>
                        <td className="mono">{formatCurrency(di.paidAmount || 0)}</td>
                        <td className="mono" style={{ color: remaining > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {formatCurrency(remaining)}
                        </td>
                        <td>{di.deferredDueDate ? formatDate(di.deferredDueDate) : '-'}</td>
                        <td><Badge label={status.label} color={status.color} /></td>
                        <td>
                          {remaining > 0 && (
                            <button className="btn-custom btn-custom-accent btn-custom-sm"
                              onClick={() => { setSelectedDi(di.id); setShowPayment(true); }}>
                              <BsCashCoin size={14} /> استلام دفعة
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      )}

      <Modal show={showPayment} onClose={() => setShowPayment(false)} title="استلام دفعة">
        <div className="form-group">
          <label className="form-label">المبلغ</label>
          <input className="form-control-custom" type="number" min="1" value={payAmount}
            onChange={e => setPayAmount(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">طريقة الدفع</label>
          <select className="form-control-custom" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
            <option value="cash">نقدي</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="check">شيك</option>
            <option value="vodafone_cash">فودافون كاش</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn-custom btn-custom-outline" onClick={() => setShowPayment(false)}>إلغاء</button>
          <button className="btn-custom btn-custom-accent" onClick={handlePayment}>تسجيل الدفعة</button>
        </div>
      </Modal>
    </div>
  );
};

export default AccountantClients;
