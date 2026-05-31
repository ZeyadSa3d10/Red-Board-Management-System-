import { useState, useEffect, useMemo } from 'react';
import api from '../../api/realApi';
import { formatCurrency, formatInvoiceType, formatDateTime, formatPaymentMethod, getInvoiceBadgeColor } from '../../utils/formatters';
import RevenueChart from '../../components/reports/RevenueChart';
import Modal from '../../components/common/Modal';
import FilterBar from '../../components/common/FilterBar';
import FilterGroup from '../../components/common/FilterGroup';
import FilterSearch from '../../components/common/FilterSearch';
import FilterActions from '../../components/common/FilterActions';
import useFilters from '../../hooks/useFilters';
import { BsEye, BsReceipt, BsCalendar, BsBuilding, BsCreditCard, BsXCircle } from 'react-icons/bs';

const INVOICE_TYPES = [
  { value: '', label: 'كل الأنواع' },
  { value: 'sale', label: 'بيع نقدي' },
  { value: 'sale_deferred', label: 'بيع آجل' },
  { value: 'return_sale', label: 'مرتجع مبيعات' },
  { value: 'return_deferred', label: 'مرتجع آجل' },
  { value: 'supply_installation', label: 'توريد وتركيب' },
  { value: 'return_supply_installation', label: 'مرتجع توريد وتركيب' },
];

const PAYMENT_OPTIONS = [
  { value: '', label: 'طريقة الدفع' },
  { value: 'cash', label: 'نقدي' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'check', label: 'شيك' },
  { value: 'vodafone_cash', label: 'فودافون كاش' },
  { value: 'deferred', label: 'آجل (ذمم)' },
];

const OwnerSales = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const { filters, setFilter, resetFilters, activeCount } = useFilters({
    search: '',
    typeFilter: '',
    branchFilter: '',
    paymentFilter: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    Promise.all([
      api.getInvoices(),
      api.getOwnerDashboardStats(),
      api.getBranches()
    ]).then(([inv, s, brs]) => {
      setInvoices(inv);
      setStats(s);
      setBranches(brs);
      setLoading(false);
    });
  }, []);

  const handleViewInvoice = async (id) => {
    try {
      const details = await api.getInvoiceById(id);
      setSelectedInvoice(details);
      setShowInvoiceModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = useMemo(() => invoices.filter(inv => {
    const { search, typeFilter, branchFilter, paymentFilter, dateFrom, dateTo } = filters;
    if (typeFilter && inv.type !== typeFilter) return false;
    if (branchFilter && String(inv.branchId) !== String(branchFilter)) return false;
    if (paymentFilter) {
      if (paymentFilter === 'deferred') {
        if (inv.type !== 'sale_deferred' && inv.type !== 'return_deferred') return false;
      } else {
        if (inv.paymentMethod !== paymentFilter) return false;
      }
    }
    if (dateFrom && new Date(inv.createdAt) < new Date(dateFrom)) return false;
    if (dateTo) {
      const dTo = new Date(dateTo);
      dTo.setHours(23, 59, 59, 999);
      if (new Date(inv.createdAt) > dTo) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.clientName?.toLowerCase().includes(q) ||
        inv.branchName?.toLowerCase().includes(q) ||
        inv.id.toString().includes(q)
      );
    }
    return true;
  }), [invoices, filters]);

  const totalSales = filtered.reduce((s, i) => {
    const isReturn = i.type && i.type.startsWith('return');
    return isReturn ? s - i.totalAmount : s + i.totalAmount;
  }, 0);

  const salesCount = filtered.filter(i => !i.type?.startsWith('return')).length;
  const returnsCount = filtered.filter(i => i.type?.startsWith('return')).length;

  return (
    <div className="page-container">
      <div className="reports-header">
        <div className="reports-header-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>المبيعات والأرباح</h1>
              <div className="subtitle">جميع فواتير الفروع — بحث وتصفية وعرض تفصيلي</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="kpi-bar">
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-accent)' }} />
          <div className="kpi-overline">إجمالي المبيعات</div>
          <div className="kpi-value" style={{ color: 'var(--color-accent)' }}>{formatCurrency(totalSales)}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-info)' }} />
          <div className="kpi-overline">فواتير البيع</div>
          <div className="kpi-value" style={{ color: 'var(--color-info)', fontSize: 'var(--text-base)' }}>{salesCount}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-danger)' }} />
          <div className="kpi-overline">فواتير المرتجع</div>
          <div className="kpi-value" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-base)' }}>{returnsCount}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-primary)' }} />
          <div className="kpi-overline">إجمالي الفواتير</div>
          <div className="kpi-value" style={{ color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>{filtered.length}</div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterBar variant="panel" activeCount={activeCount} onReset={resetFilters}>
        <FilterSearch value={filters.search} onChange={v => setFilter('search', v)} placeholder="بحث برقم الفاتورة أو العميل أو الفرع..." />
        <FilterGroup label="من" icon={BsCalendar}>
          <input type="date" className="form-control-custom" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
        </FilterGroup>
        <FilterGroup label="إلى" icon={BsCalendar}>
          <input type="date" className="form-control-custom" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
        </FilterGroup>
        <FilterGroup label="النوع" icon={BsReceipt}>
          <select className="form-control-custom" value={filters.typeFilter} onChange={e => setFilter('typeFilter', e.target.value)}>
            {INVOICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="الفرع" icon={BsBuilding}>
          <select className="form-control-custom" value={filters.branchFilter} onChange={e => setFilter('branchFilter', e.target.value)}>
            <option value="">كل الفروع</option>
            {branches.filter(b => !b.isAdmin).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </FilterGroup>
        <FilterGroup label="الدفع" icon={BsCreditCard}>
          <select className="form-control-custom" value={filters.paymentFilter} onChange={e => setFilter('paymentFilter', e.target.value)}>
            {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FilterGroup>
      </FilterBar>

      {/* Table */}
      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : (
        <div className="card-premium">
          <div className="card-header">
            <h6><BsReceipt /> قائمة الفواتير</h6>
            <span className="section-badge">{filtered.length} فاتورة</span>
          </div>
          <div className="card-body p-0">
            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>التاريخ</th>
                    <th>الفرع</th>
                    <th>النوع</th>
                    <th>العميل</th>
                    <th>الإجمالي</th>
                    <th>طريقة الدفع</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-numbers)' }}>{inv.invoiceNumber}</td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>{formatDateTime(inv.createdAt)}</td>
                      <td>{inv.branchName}</td>
                      <td><span className={`badge-custom ${getInvoiceBadgeColor(inv.type)}`}>{formatInvoiceType(inv.type)}</span></td>
                      <td>{inv.type === 'supply_installation' || inv.type === 'return_supply_installation' ? inv.projectName || <span style={{ color: 'var(--color-text-muted)' }}>—</span> : inv.clientName || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                      <td className="mono" style={{ fontWeight: 700 }}>{formatCurrency(inv.totalAmount)}</td>
                      <td>
                        {inv.paymentMethod ? (
                          <span className="badge-modern badge-gray">
                            <span className="dot" /> {formatPaymentMethod(inv.paymentMethod)}
                          </span>
                        ) : inv.type === 'sale_deferred' ? (
                          inv.remainingAmount <= 0 ? (
                            <span className="badge-modern badge-green"><span className="dot" /> آجل (تم التسديد)</span>
                          ) : inv.paidAmount > 0 ? (
                            <span className="badge-modern badge-yellow"><span className="dot" /> آجل (مدفوع جزئياً)</span>
                          ) : (
                            <span className="badge-modern badge-red"><span className="dot" /> آجل</span>
                          )
                        ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <button className="btn-icon" title="عرض التفاصيل" onClick={() => handleViewInvoice(inv.id)}>
                          <BsEye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state-modern" style={{ padding: '40px 0' }}>
                          <div className="empty-icon-wrapper"><BsReceipt /></div>
                          <h4>لا توجد فواتير</h4>
                          <p>لا توجد فواتير تطابق معايير البحث</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      <Modal show={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} title={`تفاصيل الفاتورة: ${selectedInvoice?.invoiceNumber}`}>
        {selectedInvoice && (
          <div>
            <div className="grid-2-sm" style={{ gap: 15, marginBottom: 20 }}>
              <div><strong>الفرع:</strong> {selectedInvoice.branchName}</div>
              <div><strong>التاريخ:</strong> {formatDateTime(selectedInvoice.createdAt)}</div>
              {selectedInvoice.type === 'supply_installation' || selectedInvoice.type === 'return_supply_installation' ? (
                <div><strong>اسم المشروع:</strong> {selectedInvoice.projectName || '—'}</div>
              ) : (
                <div><strong>العميل:</strong> {selectedInvoice.clientName || 'عميل نقدي'}
                </div>
              )}
              {selectedInvoice.type !== 'supply_installation' && selectedInvoice.type !== 'return_supply_installation' && (
                <div><strong>طريقة الدفع:</strong> {
                  selectedInvoice.paymentMethod
                    ? formatPaymentMethod(selectedInvoice.paymentMethod)
                    : (selectedInvoice.type === 'sale_deferred' ? (
                      selectedInvoice.remainingAmount <= 0 ? 'آجل (تم التسديد)' : (selectedInvoice.paidAmount > 0 ? 'آجل (مدفوع جزئياً)' : 'آجل')
                    ) : 'نقدي')
                }</div>
              )}
            </div>

            <table className="table-custom">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{item.productName}</td>
                    <td className="mono">{item.qty}</td>
                    <td className="mono">{formatCurrency(item.unitPrice)}</td>
                    <td className="mono" style={{ fontWeight: 600 }}>{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 20, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {selectedInvoice.notes && (
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    <strong>ملاحظات:</strong> {selectedInvoice.notes}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                الإجمالي: <span className="mono" style={{ color: 'var(--color-accent)' }}>{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OwnerSales;
