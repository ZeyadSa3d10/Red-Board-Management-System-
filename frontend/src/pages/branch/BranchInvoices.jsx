import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import SalesInvoiceForm from '../../components/invoices/SalesInvoiceForm';
import InvoiceCard from '../../components/invoices/InvoiceCard';
import InvoicePrint from '../../components/invoices/InvoicePrint';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterGroup from '../../components/common/FilterGroup';
import FilterSearch from '../../components/common/FilterSearch';
import { formatInvoiceType, formatCurrency, formatDateTime, formatPaymentMethod, getInvoiceBadgeColor } from '../../utils/formatters';
import { BsPlus, BsArrowDown, BsArrowUp } from 'react-icons/bs';

const BranchInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedInvoiceFull, setSelectedInvoiceFull] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [filterInputs, setFilterInputs] = useState({ dateFrom: '', dateTo: '' });
  const tableRef = useRef(null);
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '', type: '' });

  const load = async (appliedFilters = {}) => {
    setLoading(true);
    try {
      const params = user?.role === 'owner' || user?.role === 'accountant'
        ? {} : { branchId: user?.branchId };
      if (appliedFilters.dateFrom) params.dateFrom = appliedFilters.dateFrom;
      if (appliedFilters.dateTo) params.dateTo = appliedFilters.dateTo;
      const [salesData, purchaseData] = await Promise.all([
        api.getInvoices(params),
        api.getPurchaseInvoices(params).catch(() => []),
      ]);
      const purchases = (purchaseData || []).map(p => ({
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
      const merged = [...(salesData || []), ...purchases]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(merged);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setInvoices([]);
    }
    setLoading(false);
  };

  const handleApplyFilter = () => {
    load({ dateFrom: filterInputs.dateFrom, dateTo: filterInputs.dateTo });
  };

  const handleReset = () => {
    resetFilters();
    setFilterInputs({ dateFrom: '', dateTo: '' });
    load();
  };

  useEffect(() => { load(); }, [user]);

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

  const filtered = invoices.filter(inv => {
    if (filters.type && inv.type !== filters.type) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchId = String(inv.invoiceNumber || inv.id).toLowerCase().includes(q);
      const matchName = inv.clientName?.toLowerCase().includes(q);
      const matchProject = (inv.type === 'supply_installation' || inv.type === 'return_supply_installation') && inv.projectName?.toLowerCase().includes(q);
      return matchId || matchName || matchProject;
    }
    return true;
  });

  const showingAll = visibleCount >= filtered.length;
  const visibleInvoices = filtered.slice(0, visibleCount);

  return (
    <div>
      <div className="page-header">
        <h2>الفواتير</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowForm(true)}>
          <BsPlus size={20} /> فاتورة جديدة
        </button>
      </div>

      {showForm ? (
        <SalesInvoiceForm onComplete={() => { setShowForm(false); load(); }} />
      ) : (
        <>
          <FilterBar variant="panel" onReset={handleReset} activeCount={activeCount}>
            <FilterSearch value={filters.search} onChange={v => setFilter('search', v)} placeholder="بحث برقم الفاتورة أو العميل..." />
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
                <option value="purchase">فاتورة مورد</option>
              </select>
            </FilterGroup>
            <FilterGroup label="من تاريخ">
              <input className="form-control-custom" type="date" value={filterInputs.dateFrom}
                onChange={e => setFilterInputs(prev => ({ ...prev, dateFrom: e.target.value }))} />
            </FilterGroup>
            <FilterGroup label="إلى تاريخ">
              <input className="form-control-custom" type="date" value={filterInputs.dateTo}
                onChange={e => setFilterInputs(prev => ({ ...prev, dateTo: e.target.value }))} />
            </FilterGroup>
            <button className="btn-custom btn-custom-primary" onClick={handleApplyFilter} style={{ alignSelf: 'flex-end' }}>
              تطبيق
            </button>
          </FilterBar>

          {loading ? (
            <div className="loading-container"><div className="spinner-border" /></div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }} ref={tableRef}>
              <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>التاريخ</th>
                    <th>النوع</th>
                    <th>الفرع</th>
                    <th>العميل</th>
                    <th>صادر باسم</th>
                    <th>الإجمالي</th>
                    <th>طريقة الدفع</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleInvoices.map(inv => (
                    <tr key={inv.id} onClick={() => handleSelectInvoice(inv)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 500 }}>{inv.invoiceNumber || inv.id}</td>
                      <td>{formatDateTime(inv.createdAt)}</td>
                      <td><span className={`badge-custom ${getInvoiceBadgeColor(inv.type)}`}>{formatInvoiceType(inv.type)}</span></td>
                      <td style={{ fontSize: '0.85rem' }}>{inv.branchName || '-'}</td>
                      <td>{inv.type === 'supply_installation' || inv.type === 'return_supply_installation' ? inv.projectName || '—' : inv.clientName || 'نقدي'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{inv.createdBy || '-'}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                      <td>{inv.paymentMethod ? formatPaymentMethod(inv.paymentMethod) : '-'}</td>
                      <td>
                        <InvoicePrint invoice={inv} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {filtered.length > 10 && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  {!showingAll ? (
                    <button className="btn-custom btn-custom-outline" onClick={() => setVisibleCount(prev => Math.min(prev + 10, filtered.length))}>
                      <BsArrowDown size={16} /> عرض المزيد ({filtered.length - visibleCount})
                    </button>
                  ) : (
                    <button className="btn-custom btn-custom-outline" onClick={() => {
                      setVisibleCount(10);
                      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}>
                      <BsArrowUp size={16} /> عرض الأقل
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
