import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate, getToday } from '../../utils/formatters';
import { useNotifications } from '../../context/NotificationContext';
import Badge from '../../components/common/Badge';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import { BsCashCoin, BsFileText, BsPlusLg } from 'react-icons/bs';

const OwnerSuppliers = () => {
  const { addNotification } = useNotifications();
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [selectedPinv, setSelectedPinv] = useState(null);
  const [showStatement, setShowStatement] = useState(false);
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '', phone: '', address: '', categoryId: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const [s, pi] = await Promise.all([api.getSuppliers(), api.getPurchaseInvoices()]);
      setSuppliers(s || []);
      setPurchaseInvoices(pi || []);
    } catch (err) {
      addNotification('تعذر تحميل بيانات الموردين', 'danger');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      addNotification('يرجى إدخال مبلغ صحيح', 'danger');
      return;
    }
    try {
      if (selectedPinv) {
        await api.addPurchasePayment(selectedPinv, {
          amount: Number(payAmount),
          paymentMethod: payMethod,
          date: getToday(),
        });
      } else {
        await api.addSupplierPaymentIndep(selectedSupplier.id, {
          amount: Number(payAmount),
          paymentMethod: payMethod,
          date: getToday(),
        });
      }
      addNotification('تم تسجيل الدفعة بنجاح', 'success');
      setShowPayment(false);
      setPayAmount('');
      setSelectedPinv(null);
      load();
    } catch (err) {
      addNotification('فشل تسجيل الدفعة', 'danger');
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name) {
      addNotification('يرجى إدخال اسم المورد', 'danger');
      return;
    }
    try {
      await api.http.post('/Supplier', newSupplier);
      addNotification('تم إضافة المورد بنجاح', 'success');
      setShowAddModal(false);
      setNewSupplier({ name: '', phone: '', address: '', categoryId: '' });
      load();
    } catch (err) {
      addNotification('فشل إضافة المورد', 'danger');
    }
  };

  const viewStatement = async (supplier) => {
    try {
      const stmt = await api.getSupplierStatement(supplier.id);
      setStatement(stmt);
      setShowStatement(true);
    } catch {
      addNotification('تعذر تحميل كشف الحساب', 'danger');
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(filters.search.toLowerCase())
  );

  const totalOwed = suppliers.reduce((s, sup) => s + (sup.totalDue || 0), 0);
  const totalPaid = suppliers.reduce((s, sup) => s + (sup.totalPaid || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2>الموردون</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowAddModal(true)}>
          <BsPlusLg size={14} style={{ marginLeft: 6 }} /> إضافة مورد
        </button>
      </div>
      <FilterBar variant="simple" onReset={resetFilters} activeCount={activeCount}>
        <FilterSearch value={filters.search} onChange={v => setFilter('search', v)} placeholder="بحث باسم المورد..." />
      </FilterBar>

      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-label">إجمالي المديونية للموردين</div>
              <div className="stat-value sv-red">{formatCurrency(totalOwed)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">إجمالي المدفوع للموردين</div>
              <div className="stat-value sv-green">{formatCurrency(totalPaid)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">عدد الموردين</div>
              <div className="stat-value sv-blue">{suppliers.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">فواتير شراء مفتوحة</div>
              <div className="stat-value sv-amber">
                {purchaseInvoices.filter(pi => pi.remainingAmount > 0).length}
              </div>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>المورد</th>
                  <th>رقم الهاتف</th>
                  <th>العنوان</th>
                  <th>إجمالي المشتريات</th>
                  <th>المدفوع</th>
                  <th>المستحق</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} onClick={() => setSelectedSupplier(s)}
                    style={{ cursor: 'pointer', background: selectedSupplier?.id === s.id ? 'var(--color-surface-alt)' : '' }}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.address || '-'}</td>
                    <td className="mono">{formatCurrency((s.totalDue || 0) + (s.totalPaid || 0))}</td>
                    <td className="mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(s.totalPaid || 0)}</td>
                    <td className="mono" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{formatCurrency(s.totalDue || 0)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-custom btn-custom-outline btn-custom-sm" onClick={(e) => { e.stopPropagation(); viewStatement(s); }}>
                          <BsFileText size={14} /> كشف حساب
                        </button>
                        <button className="btn-custom btn-custom-accent btn-custom-sm" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedSupplier(s);
                            setSelectedPinv(null);
                            setShowPayment(true);
                          }}
                        >
                          <BsCashCoin size={14} /> دفع
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {selectedSupplier && (
            <div className="card" style={{ padding: 20, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h5 style={{ fontWeight: 600, margin: 0 }}>فواتير المشتريات - {selectedSupplier.name}</h5>
              </div>
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
                  {purchaseInvoices.filter(pi => pi.supplierId === selectedSupplier.id).map(pi => (
                    <tr key={pi.id}>
                      <td style={{ fontWeight: 600 }}>{pi.invoiceNumber || pi.id}</td>
                      <td>{formatDate(pi.invoiceDate || pi.date)}</td>
                      <td>{pi.branchName || pi.branchId}</td>
                      <td className="mono">{formatCurrency(pi.totalAmount)}</td>
                      <td className="mono">{formatCurrency(pi.paidAmount)}</td>
                      <td className="mono" style={{ color: pi.remainingAmount > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                        {formatCurrency(pi.remainingAmount)}
                      </td>
                      <td>
                        <Badge 
                          label={pi.remainingAmount <= 0 ? 'مسددة' : pi.paidAmount > 0 ? 'مسددة جزئياً' : 'غير مسددة'} 
                          color={pi.remainingAmount <= 0 ? 'success' : pi.paidAmount > 0 ? 'warning' : 'danger'} 
                        />
                      </td>
                      <td>
                        {pi.remainingAmount > 0 && (
                          <button className="btn-custom btn-custom-accent btn-custom-sm"
                            onClick={() => { setSelectedPinv(pi.id); setShowPayment(true); }}>
                            <BsCashCoin size={14} /> دفع للفاتورة
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {purchaseInvoices.filter(pi => pi.supplierId === selectedSupplier.id).length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)' }}>
                        لا توجد فواتير مشتريات مسجلة لهذا المورد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Payment Modal */}
      <Modal show={showPayment} onClose={() => setShowPayment(false)} title={selectedPinv ? 'دفع قيمة فاتورة' : `دفع مبلغ للمورد: ${selectedSupplier?.name}`}>
        <div style={{ background: 'var(--color-bg-alt)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {selectedPinv ? 'المبلغ المتبقي من الفاتورة:' : 'إجمالي المديونية للمورد:'}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-danger)' }}>
            {selectedPinv 
              ? formatCurrency(purchaseInvoices.find(pi => pi.id === selectedPinv)?.remainingAmount || 0)
              : formatCurrency(selectedSupplier?.totalDue || 0)
            }
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>المبلغ المراد دفعه</label>
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

      {/* Add Supplier Modal */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} title="إضافة مورد جديد">
        <div className="grid-2-sm" style={{ gap: 12 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>اسم المورد *</label>
            <input className="form-control-custom" value={newSupplier.name} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>رقم الهاتف</label>
            <input className="form-control-custom" value={newSupplier.phone} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>التصنيف (اختياري)</label>
            <input className="form-control-custom" value={newSupplier.categoryId} onChange={e => setNewSupplier({ ...newSupplier, categoryId: e.target.value })} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>العنوان</label>
            <input className="form-control-custom" value={newSupplier.address} onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-custom btn-custom-outline" onClick={() => setShowAddModal(false)}>إلغاء</button>
          <button className="btn-custom btn-custom-accent" onClick={handleAddSupplier}>حفظ المورد</button>
        </div>
      </Modal>

      {/* Statement Modal */}
      <Modal show={showStatement} onClose={() => setShowStatement(false)} title="كشف حساب مورد" size="lg">
        {statement && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h5 style={{ margin: 0 }}>{statement.supplierName}</h5>
              <div className="mono" style={{ fontWeight: 700 }}>
                الرصيد الحالي: <span style={{ color: statement.currentBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {formatCurrency(statement.currentBalance)}
                </span>
              </div>
            </div>
            <table className="table-custom">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>البيان</th>
                  <th>مشتريات (مدين)</th>
                  <th>مدفوعات (دائن)</th>
                  <th>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {(statement.items || []).map((item, i) => (
                  <tr key={i}>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.description}</td>
                    <td className="mono" style={{ color: 'var(--color-danger)' }}>{item.debit > 0 ? formatCurrency(item.debit) : '—'}</td>
                    <td className="mono" style={{ color: 'var(--color-success)' }}>{item.credit > 0 ? formatCurrency(item.credit) : '—'}</td>
                    <td className="mono">{formatCurrency(item.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OwnerSuppliers;
