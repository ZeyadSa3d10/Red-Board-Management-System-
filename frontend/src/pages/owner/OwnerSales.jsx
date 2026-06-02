import { useState, useEffect, useCallback } from 'react';
import api from '../../api/realApi';
import { formatCurrency, formatInvoiceType, formatDateTime, formatPaymentMethod, getInvoiceBadgeColor } from '../../utils/formatters';
import RevenueChart from '../../components/reports/RevenueChart';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
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

const OwnerSales = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [salesStats, setSalesStats] = useState(null);

  const { filters, setFilter, resetFilters, activeCount } = useFilters({
    search: '', typeFilter: '', branchFilter: '', dateFrom: '', dateTo: '',
  }, { debounceMs: 400 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 15 };
      if (filters.search) params.search = filters.search;
      if (filters.typeFilter) params.type = filters.typeFilter;
      if (filters.branchFilter) params.branchId = filters.branchFilter;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const [data, sStats] = await Promise.all([
        api.getInvoices(params),
        api.getSalesStats({ dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined, branchId: filters.branchFilter || undefined, type: filters.typeFilter ? filters.typeFilter : undefined }),
      ]);
      setInvoices(data);
      setTotalCount(data.totalCount || 0);
      setSalesStats(sStats);
    } catch { setInvoices([]); setTotalCount(0); setSalesStats(null); }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.getBranches().then(setBranches).catch(() => {});
  }, []);

  const handleApply = () => setPage(1);

  const handleReset = () => { resetFilters(); setPage(1); };

  const handleViewInvoice = async (id) => {
    try {
      const details = await api.getInvoiceById(id);
      setSelectedInvoice(details);
      setShowInvoiceModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { key: 'invoiceNumber', header: 'رقم الفاتورة', render: (v) => <span style={{ fontWeight: 600, fontFamily: 'var(--font-numbers)' }}>{v}</span> },
    { key: 'createdAt', header: 'التاريخ', render: (v) => <span style={{ fontSize: 'var(--text-sm)' }}>{formatDateTime(v)}</span> },
    { key: 'branchName', header: 'الفرع' },
    { key: 'type', header: 'النوع', render: (v) => <span className={`badge-custom ${getInvoiceBadgeColor(v)}`}>{formatInvoiceType(v)}</span> },
    {
      key: 'clientName', header: 'العميل', render: (v, row) => {
        if (row.type === 'supply_installation' || row.type === 'return_supply_installation') return row.projectName || '—';
        return v || '—';
      }
    },
    { key: 'totalAmount', header: 'الإجمالي', render: (v) => <span className="mono" style={{ fontWeight: 700 }}>{formatCurrency(v)}</span> },
    {
      key: 'paymentMethod', header: 'طريقة الدفع', render: (v, row) => {
        if (v) return <span className="badge-modern badge-gray"><span className="dot" /> {formatPaymentMethod(v)}</span>;
        if (row.type === 'sale_deferred') {
          if (row.remainingAmount <= 0) return <span className="badge-modern badge-green"><span className="dot" /> آجل (تم التسديد)</span>;
          if (row.paidAmount > 0) return <span className="badge-modern badge-yellow"><span className="dot" /> آجل (مدفوع جزئياً)</span>;
          return <span className="badge-modern badge-red"><span className="dot" /> آجل</span>;
        }
        return '—';
      }
    },
    {
      key: 'actions', header: '', sortable: false, render: (_, row) => (
        <button className="btn-icon" title="عرض التفاصيل" onClick={(e) => { e.stopPropagation(); handleViewInvoice(row.id); }}>
          <BsEye size={16} />
        </button>
      )
    },
  ];

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
      <div className="kpi-bar" style={{ opacity: loading && salesStats ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-accent)' }} />
          <div className="kpi-overline">إجمالي المبيعات</div>
          <div className="kpi-value" style={{ color: 'var(--color-accent)' }}>{formatCurrency(salesStats?.totalSales || 0)}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-danger)' }} />
          <div className="kpi-overline">المرتجعات</div>
          <div className="kpi-value" style={{ color: 'var(--color-danger)', fontSize: 'var(--text-base)' }}>{formatCurrency(salesStats?.totalReturns || 0)}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-warning)' }} />
          <div className="kpi-overline">آجل</div>
          <div className="kpi-value" style={{ color: 'var(--color-warning)', fontSize: 'var(--text-base)' }}>{formatCurrency(salesStats?.totalDeferred || 0)}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-success)' }} />
          <div className="kpi-overline">صافي المبيعات</div>
          <div className="kpi-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(salesStats?.netSales || 0)}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-primary)' }} />
          <div className="kpi-overline">إجمالي الفواتير</div>
          <div className="kpi-value" style={{ color: 'var(--color-primary)', fontSize: 'var(--text-base)' }}>{totalCount}</div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterBar variant="panel" activeCount={activeCount} onReset={handleReset} onApply={handleApply} loading={loading}>
        <FilterSearch value={filters.search} onChange={v => { setFilter('search', v); }} placeholder="بحث برقم الفاتورة أو العميل أو الفرع..." />
        <FilterGroup label="من" icon={BsCalendar}>
          <input type="date" className="form-control-custom" value={filters.dateFrom} onChange={e => { setFilter('dateFrom', e.target.value); }} />
        </FilterGroup>
        <FilterGroup label="إلى" icon={BsCalendar}>
          <input type="date" className="form-control-custom" value={filters.dateTo} onChange={e => { setFilter('dateTo', e.target.value); }} />
        </FilterGroup>
        <FilterGroup label="النوع" icon={BsReceipt}>
          <select className="form-control-custom" value={filters.typeFilter} onChange={e => { setFilter('typeFilter', e.target.value); }}>
            {INVOICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </FilterGroup>
        <FilterGroup label="الفرع" icon={BsBuilding}>
          <select className="form-control-custom" value={filters.branchFilter} onChange={e => { setFilter('branchFilter', e.target.value); }}>
            <option value="">كل الفروع</option>
            {branches.filter(b => !b.isAdmin).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </FilterGroup>
      </FilterBar>

      {/* Table */}
      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        serverSide
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        pageSize={15}
        onRowClick={(row) => handleViewInvoice(row.id)}
      />

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
