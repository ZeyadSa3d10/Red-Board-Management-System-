import { useState, useEffect, useCallback } from 'react';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import { formatCurrency, formatDate, formatInvoiceStatus, getToday } from '../../utils/formatters';
import { useNotifications } from '../../context/NotificationContext';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import { BsCashCoin } from 'react-icons/bs';

const AccountantSuppliers = () => {
  const { addNotification } = useNotifications();
  const [suppliers, setSuppliers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [selectedPinv, setSelectedPinv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '' }, { debounceMs: 300 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getSuppliersFiltered({ search: filters.search, page, pageSize: 15 });
      const items = result?.items || result || [];
      setSuppliers(items);
      setTotalCount(result?.totalCount || items.length);
    } catch { setSuppliers([]); setTotalCount(0); }
    api.getPurchaseInvoices().then(pi => setPurchaseInvoices(pi || [])).catch(() => {});
    setLoading(false);
  }, [filters.search, page]);

  useEffect(() => { load(); }, [filters.search, page]);

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) { addNotification('يرجى إدخال مبلغ صحيح', 'danger'); return; }
    await api.addPurchasePayment(selectedPinv, { amount: Number(payAmount), paymentMethod: payMethod, date: getToday(), notes: '' });
    addNotification('تم تسجيل الدفعة للمورد', 'success');
    setShowPayment(false);
    setPayAmount('');
    load();
  };

  const columns = [
    { key: 'name', header: 'المورد', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'phone', header: 'رقم الهاتف', render: (v) => v || '-' },
    { key: 'totalDue', header: 'المستحق', render: (v) => <span className="mono" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{formatCurrency(v || 0)}</span> },
    { key: 'totalPaid', header: 'المدفوع', render: (v) => <span className="mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(v || 0)}</span> },
    { key: 'actions', header: 'الإجراءات', sortable: false, render: (_, row) => (
      <button className="btn-custom btn-custom-accent btn-custom-sm"
        onClick={(e) => { e.stopPropagation(); setSelectedSupplier(row); setSelectedPinv(null); setShowPayment(true); }}>
        <BsCashCoin size={14} /> دفع
      </button>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <h2>الموردون</h2>
      </div>

      <FilterBar variant="simple" onReset={() => { resetFilters(); setPage(1); }} activeCount={activeCount} loading={loading}>
        <FilterSearch value={filters.search} onChange={v => { setFilter('search', v); setPage(1); }} placeholder="بحث باسم المورد..." />
      </FilterBar>

      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        onRowClick={(row) => setSelectedSupplier(row)}
        serverSide
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        pageSize={15}
      />

      <Modal show={showPayment} onClose={() => setShowPayment(false)} title={`دفع مبلغ للمورد: ${selectedSupplier?.name}`}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>المبلغ المراد دفعه</label>
          <input className="form-control-custom" type="number" min="1" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
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
