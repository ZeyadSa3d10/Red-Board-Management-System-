import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BsPeople, BsExclamationCircle, BsCashCoin, BsPlus } from 'react-icons/bs';
import AddClientModal from '../../components/pos/AddClientModal';

const BranchClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '' });
  const [selectedClient, setSelectedClient] = useState(null);
  const [deferredInvoices, setDeferredInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getClients();
        setClients(data);
      } catch { }
      setLoading(false);
    };
    load();
  }, []);

  const handleSelectClient = async (c) => {
    setSelectedClient(c);
    setLoadingDetail(true);
    setDeferredInvoices([]);
    setPayments([]);
    try {
      const [di, p] = await Promise.all([
        api.getInvoices({ branchId: user?.branchId, type: 'sale_deferred', clientId: c.id }).catch(() => []),
        api.getClientPayments(c.id, user?.branchId).catch(() => []),
      ]);
      setDeferredInvoices(Array.isArray(di) ? di : []);
      setPayments(Array.isArray(p) ? p : []);
    } catch { }
    setLoadingDetail(false);
  };

  const filtered = clients.filter(c => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <h2><BsPeople size={22} style={{ marginLeft: 8 }} />العملاء</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowAddModal(true)}>
          <BsPlus size={18} /> إضافة عميل
        </button>
      </div>

      <FilterBar variant="simple" onReset={resetFilters} activeCount={activeCount}>
        <FilterSearch value={filters.search} onChange={v => setFilter('search', v)} placeholder="بحث باسم العميل أو رقم الهاتف..." />
      </FilterBar>

      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <BsExclamationCircle size={48} opacity={0.3} />
          <span style={{ fontSize: '1rem', display: 'block', marginTop: 12 }}>لا يوجد عملاء</span>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
          <table className="table-custom client-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>رقم الهاتف</th>
                <th>حالة الحساب</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const hasDeferred = c.totalDeferred > 0;
                return (
                  <tr key={c.id} onClick={() => handleSelectClient(c)} style={{ cursor: 'pointer' }}>
                    <td data-label="الاسم" style={{ fontWeight: 500 }}>{c.name}</td>
                    <td data-label="رقم الهاتف" dir="ltr" style={{ fontFamily: 'var(--font-numbers)', textAlign: 'right' }}>{c.phone || '-'}</td>
                    <td data-label="حالة الحساب">
                      {hasDeferred ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: 'var(--color-danger-bg, #fef2f2)', color: 'var(--color-danger, #dc2626)',
                          padding: '4px 12px', borderRadius: 'var(--radius-sm, 6px)',
                          fontSize: '0.85rem', fontWeight: 600,
                        }}>
                          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>أجل</span>
                          <span className="mono">{formatCurrency(c.totalDeferred)}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Modal show={!!selectedClient} onClose={() => setSelectedClient(null)}
        title={selectedClient?.name || 'العميل'} size="lg">
        {loadingDetail ? (
          <div className="loading-container"><div className="spinner-border" /></div>
        ) : (
          <>
            {selectedClient && (
              <div style={{ marginBottom: 16, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <span>{selectedClient.phone}</span>
                {selectedClient.totalDeferred > 0 && (
                  <span style={{ marginRight: 16, color: 'var(--color-danger)', fontWeight: 600 }}>
                    أجل: {formatCurrency(selectedClient.totalDeferred)}
                  </span>
                )}
              </div>
            )}

            {deferredInvoices.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h6 style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>الفواتير الآجلة</h6>
                <table className="table-custom client-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>رقم الفاتورة</th>
                      <th>المبلغ</th>
                      <th>المتبقي</th>
                      <th>تاريخ الاستحقاق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deferredInvoices.map(inv => (
                      <tr key={inv.id}>
                        <td data-label="رقم الفاتورة">{inv.invoiceNumber}</td>
                        <td data-label="المبلغ" className="mono">{formatCurrency(inv.totalAmount)}</td>
                        <td data-label="المتبقي" className="mono" style={{ color: (inv.remainingAmount || 0) > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {formatCurrency(inv.remainingAmount || 0)}
                        </td>
                        <td data-label="تاريخ الاستحقاق">{formatDate(inv.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BsCashCoin size={16} />
                <h6 style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>سجل المدفوعات</h6>
              </div>
              {payments.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>لا توجد مدفوعات مسجلة</p>
              ) : (
                <table className="table-custom client-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                      <th>طريقة الدفع</th>
                      <th>ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td data-label="التاريخ">{formatDate(p.paymentDate)}</td>
                        <td data-label="المبلغ" className="mono" style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(p.amount)}</td>
                        <td data-label="طريقة الدفع">{p.paymentMethod === 'Cash' ? 'نقدي' : p.paymentMethod === 'BankTransfer' ? 'تحويل بنكي' : p.paymentMethod === 'Check' ? 'شيك' : p.paymentMethod === 'VodafoneCash' ? 'فودافون كاش' : p.paymentMethod}</td>
                        <td data-label="ملاحظات" style={{ color: 'var(--color-text-secondary)' }}>{p.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </Modal>

      <AddClientModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientAdded={() => {
          const load = async () => {
            setLoading(true);
            try { setClients(await api.getClients()); } catch { }
            setLoading(false);
          };
          load();
        }}
      />
    </div>
  );
};

export default BranchClients;
