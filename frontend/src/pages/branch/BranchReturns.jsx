import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../api/realApi';
import InvoiceCard from '../../components/invoices/InvoiceCard';
import InvoicePrint from '../../components/invoices/InvoicePrint';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterGroup from '../../components/common/FilterGroup';
import FilterSearch from '../../components/common/FilterSearch';
import { formatInvoiceType, formatCurrency, formatDateTime, formatPaymentMethod, getInvoiceBadgeColor } from '../../utils/formatters';
import { BsArrowReturnLeft, BsBoxSeam, BsPlus } from 'react-icons/bs';

const RETURN_TYPES = ['return_sale', 'return_deferred'];

const BranchReturns = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceFull, setSelectedInvoiceFull] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '', type: '' });

  // Return form
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnQuery, setReturnQuery] = useState('');
  const [originalInvoice, setOriginalInvoice] = useState(null);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [returnItems, setReturnItems] = useState([]);
  const [returnPaymentMethod, setReturnPaymentMethod] = useState('cash');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const typeMap = { return_sale: 3, return_deferred: 4 };
      const typesStr = filters.type ? String(typeMap[filters.type] || '') : '3,4';
      const result = await api.getInvoices({
        branchId: user?.branchId,
        types: typesStr,
        page,
        pageSize: 10,
        ...(filters.search ? { search: filters.search } : {}),
      });
      const items = Array.isArray(result) ? result : (result || []);
      setInvoices(items);
      setTotalCount(result.totalCount || items.length);
    } catch {
      setInvoices([]);
      setTotalCount(0);
    }
    setLoading(false);
  }, [user, page, filters]);

  useEffect(() => { load(); }, [load]);

  const handleApply = () => { setPage(1); load(); };

  const handleReset = () => { resetFilters(); setPage(1); };

  const handleSelectInvoice = async (inv) => {
    setSelectedInvoice(inv);
    setLoadingDetail(true);
    setSelectedInvoiceFull(null);
    try {
      const full = await api.getInvoiceById(inv.id);
      setSelectedInvoiceFull(full);
    } catch {
      setSelectedInvoiceFull(inv);
    }
    setLoadingDetail(false);
  };

  const handleFetchOriginal = async () => {
    const q = returnQuery.trim();
    if (!q) { addNotification('يرجى إدخال رقم الفاتورة', 'danger'); return; }
    setLoadingOriginal(true);
    setOriginalInvoice(null);
    setReturnItems([]);
    try {
      const isNumeric = /^\d+$/.test(q);
      const inv = isNumeric ? await api.getInvoiceById(Number(q)) : await api.getInvoiceByNumber(q);
      if (!['sale', 'sale_deferred'].includes(inv.type)) {
        addNotification('يمكن الإرجاع فقط من فواتير البيع النقدي والآجل', 'danger');
        setLoadingOriginal(false);
        return;
      }

      const existingReturns = await api.getInvoices({ relatedInvoiceId: Number(inv.id) }).catch(() => []);
      const returnedQtyMap = {};
      (existingReturns || []).forEach(ret => {
        (ret.items || []).forEach(item => {
          const pid = item.productId;
          returnedQtyMap[pid] = (returnedQtyMap[pid] || 0) + Number(item.quantity || item.qty || 0);
        });
      });

      const items = (inv.items || []).map(item => {
        const originalQty = Number(item.quantity || item.qty || 0);
        const returnedQty = returnedQtyMap[item.productId] || 0;
        const remaining = Math.max(0, originalQty - returnedQty);
        return {
          productId: item.productId,
          productName: item.productName || item.productId,
          originalQty,
          maxQty: remaining,
          qty: 0,
          fullyReturned: remaining <= 0,
        };
      });

      const allFullyReturned = items.every(i => i.fullyReturned);
      if (allFullyReturned) {
        addNotification('هذه الفاتورة تم استرجاع جميع كمياتها بالفعل', 'warning');
      }

      setOriginalInvoice(inv);
      setReturnItems(items);
    } catch {
      addNotification('لم يتم العثور على الفاتورة', 'danger');
    }
    setLoadingOriginal(false);
  };

  const handleReturnQtyChange = (idx, val) => {
    setReturnItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, qty: Math.min(Math.max(0, Number(val) || 0), item.maxQty) } : item
    ));
  };

  const handleSubmitReturn = async () => {
    const items = returnItems.filter(i => i.qty > 0);
    if (items.length === 0) {
      addNotification('اختر منتجات للإرجاع', 'danger');
      return;
    }
    setSaving(true);
    try {
      const isDeferred = originalInvoice.type === 'sale_deferred';
      await api.createInvoice({
        type: isDeferred ? 'return_deferred' : 'return_sale',
        branchId: user?.branchId || originalInvoice.branchId,
        relatedInvoiceId: Number(originalInvoice.id),
        items: items.map(i => ({ productId: i.productId, qty: i.qty })),
        paymentMethod: isDeferred ? undefined : returnPaymentMethod,
        notes: `مرتجع من فاتورة #${originalInvoice.invoiceNumber || originalInvoice.id}`,
      });
      addNotification('تم تسجيل المرتجع بنجاح', 'success');
      setShowReturnForm(false);
      setReturnQuery('');
      setOriginalInvoice(null);
      setReturnItems([]);
      load();
    } catch (err) {
      addNotification(err?.message || 'فشل في تسجيل المرتجع', 'danger');
    }
    setSaving(false);
  };

  const typeOpts = [
    { value: '', label: 'كل المرتجعات' },
    ...RETURN_TYPES.map(t => ({ value: t, label: formatInvoiceType(t) })),
  ];

  const columns = [
    { key: 'invoiceNumber', header: 'رقم الفاتورة', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'createdAt', header: 'التاريخ', render: (v) => formatDateTime(v) },
    { key: 'type', header: 'النوع', render: (v) => <span className={`badge-custom ${getInvoiceBadgeColor(v)}`}>{formatInvoiceType(v)}</span> },
    { key: 'clientName', header: 'العميل', render: (v) => v || 'نقدي' },
    { key: 'createdBy', header: 'صادر باسم', render: (v) => <span style={{ fontSize: '0.85rem' }}>{v || '-'}</span> },
    { key: 'totalAmount', header: 'الإجمالي', render: (v) => <span className="mono" style={{ fontWeight: 600, color: 'var(--color-danger)' }}>{formatCurrency(v)}</span> },
    { key: 'paymentMethod', header: 'طريقة الدفع', render: (v) => v ? formatPaymentMethod(v) : '-' },
    { key: 'actions', header: 'الإجراءات', sortable: false, render: (_, row) => <InvoicePrint invoice={row} /> },
  ];

  return (
    <div>
      <div className="page-header">
        <h2><BsArrowReturnLeft size={22} style={{ marginLeft: 8 }} />مرتجعات العملاء</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowReturnForm(true)}>
          <BsPlus size={20} /> إنشاء مرتجع
        </button>
      </div>

      <FilterBar variant="panel" onReset={handleReset} activeCount={activeCount} loading={loading} onApply={handleApply}>
        <FilterSearch value={filters.search} onChange={v => setFilter('search', v)} placeholder="بحث برقم الفاتورة أو العميل..." />
        <FilterGroup>
          <select className="form-control-custom" style={{ maxWidth: 200 }} value={filters.type}
            onChange={e => { setFilter('type', e.target.value); setPage(1); }}>
            {typeOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FilterGroup>
      </FilterBar>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        onRowClick={handleSelectInvoice}
        serverSide
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        pageSize={10}
        emptyMessage="لا توجد مرتجعات مسجلة"
      />

      <Modal show={!!selectedInvoice} onClose={() => setSelectedInvoice(null)}
        title={`مرتجع #${selectedInvoice?.invoiceNumber || selectedInvoice?.id}`} size="lg">
        {loadingDetail ? (
          <div className="loading-container"><div className="spinner-border" /></div>
        ) : (
          selectedInvoiceFull && <InvoiceCard invoice={selectedInvoiceFull} />
        )}
        {!loadingDetail && selectedInvoiceFull && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <InvoicePrint invoice={selectedInvoiceFull} />
          </div>
        )}
      </Modal>

      {/* Return creation form */}
      <Modal show={showReturnForm} onClose={() => { setShowReturnForm(false); setOriginalInvoice(null); setReturnItems([]); setReturnQuery(''); }}
        title="إنشاء مرتجع" size="lg">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input className="form-control-custom" placeholder="رقم الفاتورة الأصلية (مثال: INV-2026201)"
            value={returnQuery} onChange={e => setReturnQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFetchOriginal()}
            style={{ flex: 1 }} />
          <button className="btn-custom btn-custom-primary" onClick={handleFetchOriginal} disabled={loadingOriginal}>
            {loadingOriginal ? 'جاري البحث...' : 'بحث'}
          </button>
        </div>

        {originalInvoice && (
          <>
            <div className="card" style={{ padding: 12, marginBottom: 16, background: 'var(--color-bg)' }}>
              <div className="grid-2-sm" style={{ gap: 8, fontSize: '0.85rem' }}>
                <div><strong>الفاتورة:</strong> #{originalInvoice.invoiceNumber || originalInvoice.id}</div>
                <div><strong>التاريخ:</strong> {formatDateTime(originalInvoice.createdAt)}</div>
                <div><strong>العميل:</strong> {originalInvoice.clientName || 'نقدي'}</div>
                <div><strong>الإجمالي:</strong> {formatCurrency(originalInvoice.totalAmount)}</div>
              </div>
            </div>

            <table className="table-custom" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية الأصلية</th>
                  <th>المتبقي</th>
                  <th>المرتجع</th>
                </tr>
              </thead>
              <tbody>
                {returnItems.map((item, idx) => (
                  <tr key={item.productId} style={{ opacity: item.fullyReturned ? 0.5 : 1 }}>
                    <td>{item.productName}</td>
                    <td>{item.originalQty}</td>
                    <td>{item.maxQty}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.fullyReturned ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-success, #16a34a)', fontWeight: 500 }}>تم الاسترجاع كلياً</span>
                      ) : (
                        <>
                          <input type="number" min="0" max={item.maxQty} value={item.qty}
                            onChange={e => handleReturnQtyChange(idx, e.target.value)}
                            style={{ width: 80, padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-numbers)' }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>/ {item.maxQty}</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              {originalInvoice.type !== 'sale_deferred' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500 }}>طريقة الدفع:</label>
                  <select className="form-control-custom" style={{ maxWidth: 160 }} value={returnPaymentMethod}
                    onChange={e => setReturnPaymentMethod(e.target.value)}>
                    <option value="cash">نقدي</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="check">شيك</option>
                    <option value="vodafone_cash">فودافون كاش</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginRight: originalInvoice.type === 'sale_deferred' ? 'auto' : 0 }}>
                <button className="btn-custom btn-custom-outline" onClick={() => { setShowReturnForm(false); setOriginalInvoice(null); setReturnItems([]); setReturnQuery(''); }}>
                  إلغاء
                </button>
                <button className="btn-custom btn-custom-accent" onClick={handleSubmitReturn} disabled={saving || returnItems.every(i => i.qty === 0)}>
                  {saving ? 'جاري الحفظ...' : 'تسجيل المرتجع'}
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default BranchReturns;
