import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../api/realApi';
import SalesInvoiceForm from '../../components/invoices/SalesInvoiceForm';
import InvoiceCard from '../../components/invoices/InvoiceCard';
import InvoicePrint from '../../components/invoices/InvoicePrint';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterGroup from '../../components/common/FilterGroup';
import FilterSearch from '../../components/common/FilterSearch';
import DateRangePicker from '../../components/common/DateRangePicker';
import { formatInvoiceType, formatCurrency, formatDateTime, formatPaymentMethod, getInvoiceBadgeColor } from '../../utils/formatters';
import { BsPlus } from 'react-icons/bs';

const BranchInvoices = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceFull, setSelectedInvoiceFull] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [employees, setEmployees] = useState([]);

  const { filters, setFilter, resetFilters, activeCount } = useFilters({
    search: '',
    employeeId: '',
    type: '',
    dateFrom: '',
    dateTo: '',
  }, { debounceMs: 400 });

  const isOwnerOrAccountant = user?.role === 'owner' || user?.role === 'accountant';

  useEffect(() => {
    if (isOwnerOrAccountant) {
      api.getEmployees().then(res => setEmployees(res || [])).catch(console.error);
    } else if (user?.branchId) {
      api.getEmployeesByBranch(user.branchId).then(res => setEmployees(res?.items || res || [])).catch(console.error);
    }
  }, [user, isOwnerOrAccountant]);

  const loadInvoices = useCallback(async (filtersToApply) => {
    setLoading(true);
    try {
      const baseParams = isOwnerOrAccountant ? {} : { branchId: user?.branchId };

      const isPurchaseOnly = filtersToApply.type === 'purchase';
      const isSalesOnly = filtersToApply.type && filtersToApply.type !== 'purchase';

      const salesParams = {
        ...baseParams,
        page: page,
        pageSize: 10,
        ...(filtersToApply.search ? { search: filtersToApply.search } : {}),
        ...(filtersToApply.employeeId ? { employeeId: filtersToApply.employeeId } : {}),
        ...(filtersToApply.type && !isPurchaseOnly ? { type: filtersToApply.type } : {}),
        ...(filtersToApply.dateFrom ? { dateFrom: filtersToApply.dateFrom } : {}),
        ...(filtersToApply.dateTo ? { dateTo: filtersToApply.dateTo } : {}),
      };

      const purchaseParams = {
        ...baseParams,
        page: page,
        pageSize: 10,
        ...(filtersToApply.search ? { search: filtersToApply.search } : {}),
        ...(filtersToApply.employeeId ? { employeeId: filtersToApply.employeeId } : {}),
        ...(filtersToApply.dateFrom ? { dateFrom: filtersToApply.dateFrom } : {}),
        ...(filtersToApply.dateTo ? { dateTo: filtersToApply.dateTo } : {}),
      };

      // فواتير المورد بتظهر بس لـ owner و accountant
      const [salesData, purchaseData] = await Promise.all([
        isSalesOnly
          ? api.getInvoices(salesParams).catch(() => [])
          : isPurchaseOnly
            ? Promise.resolve([])
            : api.getInvoices(salesParams).catch(() => []),
        isOwnerOrAccountant && !isSalesOnly
          ? api.getPurchaseInvoicesFiltered(purchaseParams).catch(() => ({ items: [], totalCount: 0 }))
          : Promise.resolve({ items: [], totalCount: 0 }),
      ]);

      const salesResult = Array.isArray(salesData) ? salesData : [];
      const purchases = (purchaseData.items || []).map(p => ({
        id: 'p_' + p.id,
        invoiceNumber: p.invoiceNumber,
        type: 'purchase',
        branchName: p.branchName,
        clientName: p.supplierName,
        createdBy: p.addedByName || '-',
        totalAmount: p.totalAmount,
        paidAmount: p.paidAmount,
        remainingAmount: p.remainingAmount,
        paymentMethod: p.paymentMethod,
        createdAt: p.invoiceDate,
        _raw: p,
        _isPurchase: true,
      }));

      const merged = [...salesResult, ...purchases]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(merged);
      setTotalCount((salesResult.totalCount || 0) + (purchaseData.totalCount || 0));
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setInvoices([]);
      setTotalCount(0);
    }
    setLoading(false);
  }, [user, page]);

  useEffect(() => {
    loadInvoices(filters);
  }, [filters, loadInvoices]);

  const handleApply = () => {
    setPage(1);
    loadInvoices(filters);
  };

  const handleReset = () => {
    resetFilters();
    setPage(1);
  };

  const handleSelectInvoice = async (inv) => {
    setSelectedInvoice(inv);
    setLoadingDetail(true);
    setSelectedInvoiceFull(null);
    try {
      if (inv._isPurchase) {
        const full = await api.getPurchaseInvoiceById(inv._raw.id);
        setSelectedInvoiceFull(full);
      } else {
        const full = await api.getInvoiceById(inv.id);
        setSelectedInvoiceFull(full);
      }
    } catch {
      setSelectedInvoiceFull(inv._raw || inv);
    }
    setLoadingDetail(false);
  };

  const columns = [
    {
      key: 'invoiceNumber', header: 'رقم الفاتورة', render: (v) => (
        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {v}
          <button
            className="btn-custom-outline"
            style={{ padding: '2px 6px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(v);
              addNotification('تم نسخ الفاتورة', 'success');
            }}
            title="نسخ رقم الفاتورة"
          >
            📋
          </button>
        </span>
      )
    },
    { key: 'createdAt', header: 'التاريخ', render: (v) => formatDateTime(v) },
    { key: 'type', header: 'النوع', render: (v) => <span className={`badge-custom ${getInvoiceBadgeColor(v)}`}>{formatInvoiceType(v)}</span> },
    { key: 'branchName', header: 'الفرع', render: (v) => <span style={{ fontSize: '0.85rem' }}>{v || '-'}</span> },
    {
      key: 'clientName', header: 'العميل', render: (v, row) => {
        if (row.type === 'supply_installation' || row.type === 'return_supply_installation') return row.projectName || '—';
        return v || 'نقدي';
      }
    },
    { key: 'createdBy', header: 'اسم الموظف', render: (v) => <span style={{ fontSize: '0.85rem' }}>{v || '-'}</span> },
    { key: 'totalAmount', header: 'الإجمالي', render: (v) => <span className="mono" style={{ fontWeight: 600 }}>{formatCurrency(v)}</span> },
    { key: 'paymentMethod', header: 'طريقة الدفع', render: (v) => v ? formatPaymentMethod(v) : '-' },
    { key: 'actions', header: 'الإجراءات', sortable: false, render: (_, row) => <InvoicePrint invoice={row} /> },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>الفواتير</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowForm(true)}>
          <BsPlus size={20} /> فاتورة جديدة
        </button>
      </div>

      {showForm ? (
        <SalesInvoiceForm onComplete={() => { setShowForm(false); loadInvoices(filters); }} />
      ) : (
        <>
          <FilterBar variant="panel" onReset={handleReset} activeCount={activeCount} loading={loading} onApply={handleApply}>
            <FilterSearch value={filters.search} onChange={v => setFilter('search', v)} placeholder="بحث برقم الفاتورة أو العميل..." />
            <FilterGroup>
              <select className="form-control-custom" style={{ maxWidth: 200 }} value={filters.employeeId}
                onChange={e => setFilter('employeeId', e.target.value)}>
                <option value="">كل الموظفين</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            </FilterGroup>
            <FilterGroup>
              <select className="form-control-custom" style={{ maxWidth: 200 }} value={filters.type}
                onChange={e => setFilter('type', e.target.value)}>
                <option value="">كل الأنواع</option>
                <option value="sale">بيع نقدي</option>
                <option value="sale_deferred">بيع آجل</option>
                <option value="return_sale">مرتجع</option>
                <option value="return_deferred">مرتجع آجل</option>
                <option value="supply_installation">توريد وتركيب</option>
                <option value="return_supply_installation">مرتجع توريد وتركيب</option>
                <option value="transfer">تحويل</option>
                {isOwnerOrAccountant && <option value="purchase">فاتورة مورد</option>}
              </select>
            </FilterGroup>
            <DateRangePicker
              value={{ dateFrom: filters.dateFrom, dateTo: filters.dateTo }}
              onChange={({ dateFrom, dateTo }) => { setFilter('dateFrom', dateFrom); setFilter('dateTo', dateTo); }}
            />
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
          />
        </>
      )}

      <Modal show={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`فاتورة #${selectedInvoice?.invoiceNumber || selectedInvoice?.id}`} size="lg">
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
    </div>
  );
};

export default BranchInvoices;
