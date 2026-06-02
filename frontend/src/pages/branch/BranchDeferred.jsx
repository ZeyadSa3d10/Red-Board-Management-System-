import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import useFilters from '../../hooks/useFilters';
import { formatCurrency, formatDate, formatInvoiceStatus, formatInvoiceType, getInvoiceBadgeColor, getToday } from '../../utils/formatters';
import { useNotifications } from '../../context/NotificationContext';
import { BsCashCoin } from 'react-icons/bs';

const BranchDeferred = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [clients, setClients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [deferredInvoices, setDeferredInvoices] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [payCount, setPayCount] = useState(0);

  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '' }, { debounceMs: 300 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, di, dpy, rdi] = await Promise.all([
        api.getClientsFiltered({ search: filters.search, page, pageSize: 15 }).catch(() => ({ items: [], totalCount: 0 })),
        api.getInvoices({ type: 'sale_deferred' }).catch(() => []),
        api.getInvoices({ type: 'deferred_payment' }).catch(() => []),
        api.getInvoices({ type: 'return_deferred' }).catch(() => []),
      ]);
      const items = c?.items || c || [];
      setClients(items);
      setTotalCount(c?.totalCount || items.length);
      setDeferredInvoices([...di, ...dpy, ...rdi]);
    } catch { setClients([]); setTotalCount(0); setDeferredInvoices([]); }
    setLoading(false);
  }, [filters.search, page]);

  useEffect(() => { load(); }, [filters.search, page]);

  const clientInvoices = selectedClient
    ? deferredInvoices.filter(inv => inv.clientId === selectedClient.id)
    : [];

  const totalRemaining = clientInvoices.reduce((s, inv) => s + (inv.remainingAmount || 0), 0);

  const getClientDeferredTotal = (clientId) =>
    deferredInvoices.filter(inv => inv.clientId === clientId).reduce((s, inv) => s + (inv.remainingAmount || 0), 0);

  const handlePay = async () => {
    addNotification('جاري معالجة الدفعة...', 'info');
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { addNotification('يرجى إدخال مبلغ صحيح', 'danger'); return; }
    if (amount > totalRemaining) { addNotification('المبلغ يتجاوز إجمالي الديون المتبقية', 'danger'); return; }

    const unpaid = clientInvoices
      .filter(inv => (inv.remainingAmount || 0) > 0)
      .sort((a, b) => new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt));

    let remaining = amount;
    const payments = [];
    for (const inv of unpaid) {
      if (remaining <= 0) break;
      const payAmt = Math.min(remaining, inv.remainingAmount);
      const defId = inv.deferredInvoiceId;
      if (!defId) { addNotification(`فاتورة #${inv.invoiceNumber} ليس لها مرجع آجل`, 'danger'); return; }
      payments.push({ deferredInvoiceId: defId, amount: payAmt });
      remaining -= payAmt;
    }

    if (payments.length === 0) { addNotification('لا توجد فواتير غير مدفوعة لهذا العميل', 'danger'); return; }

    setSaving(true);
    try {
      for (const p of payments) {
        await api.addClientPayment(selectedClient.id, {
          deferredInvoiceId: p.deferredInvoiceId, amount: p.amount, paymentMethod: payMethod, date: getToday(),
        });
      }
      addNotification(`تم استلام ${amount.toLocaleString()} ج.م بنجاح`, 'success');
      setPayAmount('');
      setPayCount(c => c + 1);
      await load();
    } catch (err) { addNotification(err?.message || 'فشل في تسجيل الدفعة', 'danger'); }
    setSaving(false);
  };

  const columns = [
    { key: 'name', header: 'العميل', render: (v, row) => {
      const totalDeferred = getClientDeferredTotal(row.id);
      return <span style={{ fontWeight: 500 }}>{v}</span>;
    }},
    { key: 'phone', header: 'رقم الهاتف' },
    { key: 'isCompany', header: 'النوع', render: (v) => <Badge label={v ? 'شركة' : 'فرد'} color="info" /> },
    { key: 'totalDeferred', header: 'إجمالي الديون', render: (_, row) => {
      const total = getClientDeferredTotal(row.id);
      return <span className="mono" style={{ fontWeight: 600, color: total > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
        {total > 0 ? formatCurrency(total) : '—'}
      </span>;
    }},
    { key: 'invoiceCount', header: 'الفواتير المفتوحة', render: (_, row) => {
      return deferredInvoices.filter(inv => inv.clientId === row.id).length || '—';
    }},
  ];

  return (
    <div>
      <div className="page-header">
        <h2>حسابات العملاء الآجلة</h2>
      </div>

      <FilterBar variant="simple" onReset={() => { resetFilters(); setPage(1); }} activeCount={activeCount} loading={loading}>
        <FilterSearch value={filters.search} onChange={v => { setFilter('search', v); setPage(1); }} placeholder="بحث باسم العميل أو الهاتف..." />
      </FilterBar>

      <DataTable
        columns={columns}
        data={clients}
        loading={loading}
        onRowClick={(row) => { setSelectedClient(row); setPayAmount(''); }}
        serverSide
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        pageSize={15}
      />

      {selectedClient && (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h5 style={{ fontWeight: 600, margin: 0 }}>{selectedClient.name}</h5>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{selectedClient.phone}</span>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>إجمالي الديون المتبقية</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-danger)' }} className="mono">
                {formatCurrency(totalRemaining)}
              </div>
            </div>
          </div>

          <div className="filter-bar filter-bar--simple" style={{ padding: 16, borderBottom: 'none', marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4, color: 'var(--color-text-secondary)' }}>المبلغ</label>
              <input className="form-control-custom" type="number" min="1" max={totalRemaining}
                value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="المبلغ..." style={{ width: 150 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4, color: 'var(--color-text-secondary)' }}>طريقة الدفع</label>
              <select className="form-control-custom" value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ width: 130 }}>
                <option value="cash">نقدي</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
                <option value="vodafone_cash">فودافون كاش</option>
              </select>
            </div>
            <button className="btn-custom btn-custom-accent" onClick={handlePay} disabled={saving || !payAmount}>
              {saving ? 'جارٍ التسجيل...' : <><BsCashCoin size={16} /> استلام دفعة</>}
            </button>
          </div>

          <table className="table-custom">
            <thead>
              <tr>
                <th>رقم الفاتورة</th><th>النوع</th><th>الفرع</th><th>المبلغ الأصلي</th><th>المدفوع</th><th>المتبقي</th><th>تاريخ الفاتورة</th><th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {clientInvoices.map(di => {
                const status = formatInvoiceStatus(di.status);
                const remaining = di.remainingAmount || 0;
                return (
                  <tr key={di.id}>
                    <td style={{ fontWeight: 500 }}>{di.invoiceNumber}</td>
                    <td><span className={`badge-custom ${getInvoiceBadgeColor(di.type)}`}>{formatInvoiceType(di.type)}</span></td>
                    <td style={{ fontSize: '0.85rem' }}>{di.branchName || '-'}</td>
                    <td className="mono">{formatCurrency(di.totalAmount)}</td>
                    <td className="mono">{formatCurrency(di.paidAmount || 0)}</td>
                    <td className="mono" style={{ color: remaining > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{formatCurrency(remaining)}</td>
                    <td>{formatDate(di.createdAt)}</td>
                    <td><Badge label={status.label} color={status.color} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <PaymentHistory key={payCount} clientId={selectedClient.id} />
        </div>
      )}
    </div>
  );
};

const PaymentHistory = ({ clientId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    api.getClientPayments(clientId).then(data => {
      setPayments(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [clientId]);

  return (
    <div style={{ marginTop: 24, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <BsCashCoin size={18} />
        <h6 style={{ fontWeight: 600, margin: 0 }}>سجل المدفوعات</h6>
      </div>
      {loading ? (
        <div className="loading-container" style={{ padding: '20px 0' }}><div className="spinner-border" /></div>
      ) : payments.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', padding: '12px 0' }}>لا توجد مدفوعات مسجلة</p>
      ) : (
        <table className="table-custom">
          <thead><tr><th>التاريخ</th><th>المبلغ</th><th>طريقة الدفع</th><th>ملاحظات</th></tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td>{formatDate(p.paymentDate)}</td>
                <td className="mono" style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(p.amount)}</td>
                <td>{p.paymentMethod === 'Cash' ? 'نقدي' : p.paymentMethod === 'BankTransfer' ? 'تحويل بنكي' : p.paymentMethod === 'Check' ? 'شيك' : p.paymentMethod === 'VodafoneCash' ? 'فودافون كاش' : p.paymentMethod}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{p.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BranchDeferred;
