import { useState, useEffect, useCallback } from 'react';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
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
  const [totalCount, setTotalCount] = useState(0);
  const [deferredInvoices, setDeferredInvoices] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [selectedDi, setSelectedDi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '' }, { debounceMs: 300 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getClientsFiltered({ search: filters.search, page, pageSize: 15 });
      const items = result?.items || result || [];
      setClients(items);
      setTotalCount(result?.totalCount || items.length);
    } catch { setClients([]); setTotalCount(0); }
    const di = await api.getInvoices().catch(() => []);
    setDeferredInvoices(di.filter(i => i.type === 'sale_deferred'));
    setLoading(false);
  }, [filters.search, page]);

  useEffect(() => { load(); }, [filters.search, page]);

  const getClientDeferred = (clientId) => deferredInvoices.filter(i => i.clientId === clientId);

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) { addNotification('يرجى إدخال مبلغ صحيح', 'danger'); return; }
    await api.addClientPayment(selectedClient.id, {
      deferredInvoiceId: selectedDi, amount: Number(payAmount), paymentMethod: payMethod, date: getToday(), notes: '',
    });
    addNotification('تم تسجيل الدفعة', 'success');
    setShowPayment(false);
    setPayAmount('');
    load();
  };

  const columns = [
    { key: 'name', header: 'العميل', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'phone', header: 'رقم الهاتف' },
    { key: 'isCompany', header: 'النوع', render: (v) => <Badge label={v ? 'شركة' : 'فرد'} color={v ? 'info' : 'secondary'} /> },
    { key: 'totalDeferred', header: 'إجمالي الديون', render: (v) => <span className="mono" style={{ fontWeight: 600, color: v > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}>{formatCurrency(v)}</span> },
    { key: 'creditLimit', header: 'الحد الائتماني', render: (v) => <span className="mono">{v > 0 ? formatCurrency(v) : '—'}</span> },
    { key: 'actions', header: 'الإجراءات', sortable: false, render: (_, row) => {
      const unpaid = getClientDeferred(row.id).find(di => (di.totalAmount - (di.paidAmount || 0)) > 0);
      return (
        <button className="btn-custom btn-custom-accent btn-custom-sm"
          onClick={(e) => { e.stopPropagation(); setSelectedClient(row); if (unpaid) { setSelectedDi(unpaid.deferredInvoiceId); setShowPayment(true); } }}>
          <BsCashCoin size={14} /> تحصيل
        </button>
      );
    }},
  ];

  return (
    <div>
      <div className="page-header">
        <h2>العملاء</h2>
      </div>

      <FilterBar variant="simple" onReset={() => { resetFilters(); setPage(1); }} activeCount={activeCount} loading={loading}>
        <FilterSearch value={filters.search} onChange={v => { setFilter('search', v); setPage(1); }} />
      </FilterBar>

      <DataTable
        columns={columns}
        data={clients}
        loading={loading}
        onRowClick={(row) => setSelectedClient(row)}
        serverSide
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        pageSize={15}
      />

      <Modal show={showPayment} onClose={() => setShowPayment(false)} title="استلام دفعة من العميل">
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>المبلغ المراد تحصيله</label>
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
          <button className="btn-custom btn-custom-accent" onClick={handlePayment}>تسجيل الدفعة</button>
        </div>
      </Modal>
    </div>
  );
};

export default AccountantClients;
