import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate, formatInvoiceStatus, getToday } from '../../utils/formatters';
import { useNotifications } from '../../context/NotificationContext';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import { BsCashCoin } from 'react-icons/bs';

const AccountantSuppliers = () => {
  const { addNotification } = useNotifications();
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [selectedPinv, setSelectedPinv] = useState(null);
  const [loading, setLoading] = useState(true);
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '' });

  const load = async () => {
    setLoading(true);
    const [s, pi] = await Promise.all([api.getSuppliers(), api.getPurchaseInvoices()]);
    setSuppliers(s);
    setPurchaseInvoices(pi);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      addNotification('يرجى إدخال مبلغ صحيح', 'danger');
      return;
    }
    await api.addPurchasePayment(selectedPinv, {
      amount: Number(payAmount),
      paymentMethod: payMethod,
      date: getToday(),
      notes: '',
    });
    addNotification('تم تسجيل الدفعة للمورد', 'success');
    setShowPayment(false);
    setPayAmount('');
    load();
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h2>الموردون</h2>
      </div>
      <FilterBar variant="simple" onReset={resetFilters} activeCount={activeCount}>
        <FilterSearch value={filters.search} onChange={v => setFilter('search', v)} />
      </FilterBar>

      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : (
        <>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>المورد</th>
                  <th>رقم الهاتف</th>
                  <th>التصنيف</th>
                  <th>العنوان</th>
                  <th>إجمالي المشتريات</th>
                  <th>المدفوع</th>
                  <th>المستحق</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} onClick={() => setSelectedSupplier(s)}
                    style={{ cursor: 'pointer', background: selectedSupplier?.id === s.id ? 'var(--color-surface-alt)' : '' }}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.phone}</td>
                    <td>{s.categoryId}</td>
                    <td>{s.address}</td>
                    <td className="mono">{formatCurrency((s.totalDue || 0) + (s.totalPaid || 0))}</td>
                    <td className="mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(s.totalPaid || 0)}</td>
                    <td className="mono" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{formatCurrency(s.totalDue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {selectedSupplier && (
            <div className="card" style={{ padding: 20, marginTop: 20 }}>
              <h5 style={{ fontWeight: 600, marginBottom: 16 }}>فواتير شراء - {selectedSupplier.name}</h5>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>التاريخ</th>
                    <th>الفرع</th>
                    <th>الإجمالي</th>
                    <th>المدفوع</th>
                    <th>المتبقي</th>
                    <th>الحالة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseInvoices.filter(pi => pi.supplierId === selectedSupplier.id).map(pi => {
                    const status = formatInvoiceStatus(pi.status);
                    return (
                      <tr key={pi.id}>
                        <td>{pi.id}</td>
                        <td>{formatDate(pi.date)}</td>
                        <td>{pi.branchId}</td>
                        <td className="mono">{formatCurrency(pi.totalAmount)}</td>
                        <td className="mono">{formatCurrency(pi.paidAmount)}</td>
                        <td className="mono" style={{ color: pi.remainingAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {formatCurrency(pi.remainingAmount)}
                        </td>
                        <td><span className={`badge-custom badge-custom-${status.color}`}>{status.label}</span></td>
                        <td>
                          {pi.remainingAmount > 0 && (
                            <button className="btn-custom btn-custom-accent btn-custom-sm"
                              onClick={() => { setSelectedPinv(pi.id); setShowPayment(true); }}>
                              <BsCashCoin size={14} /> دفع
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal show={showPayment} onClose={() => setShowPayment(false)} title="دفعة لمورد">
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>المبلغ</label>
          <input className="form-control-custom" type="number" min="1" value={payAmount}
            onChange={e => setPayAmount(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>طريقة الدفع</label>
          <select className="form-control-custom" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
            <option value="cash">نقدي</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="check">شيك</option>
            <option value="vodafone_cash">فودافون كاش</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn-custom btn-custom-outline" onClick={() => setShowPayment(false)}>إلغاء</button>
          <button className="btn-custom btn-custom-accent" onClick={handlePayment}>تأكيد الدفع</button>
        </div>
      </Modal>
    </div>
  );
};

export default AccountantSuppliers;
