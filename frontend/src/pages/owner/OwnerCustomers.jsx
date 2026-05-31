import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate, getToday } from '../../utils/formatters';
import { useNotifications } from '../../context/NotificationContext';
import Badge from '../../components/common/Badge';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import { BsCashCoin, BsExclamationTriangle, BsFileText } from 'react-icons/bs';

const OwnerCustomers = () => {
  const { addNotification } = useNotifications();
  const [clients, setClients] = useState([]);
  const [deferredInvoices, setDeferredInvoices] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('bank_transfer');
  const [selectedDi, setSelectedDi] = useState(null);
  const [showStatement, setShowStatement] = useState(false);
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '', phone: '', address: '', isCompany: false, creditLimit: 0
  });

  const load = async () => {
    setLoading(true);
    const [c, inv] = await Promise.all([api.getClients(), api.getInvoices({ type: 'sale_deferred' })]);
    setClients(c);
    setDeferredInvoices(inv || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getClientDeferred = (clientId) => deferredInvoices.filter(i => i.clientId === clientId);

  const handlePayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      addNotification('يرجى إدخال مبلغ صحيح', 'danger');
      return;
    }
    await api.addClientPayment(selectedClient.id, {
      deferredInvoiceId: selectedDi,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      date: getToday(),
    });
    addNotification('تم تسجيل الدفعة', 'success');
    setShowPayment(false);
    setPayAmount('');
    load();
  };

  const handleAddClient = async () => {
    if (!newClient.name) {
      addNotification('يرجى إدخال اسم العميل', 'danger');
      return;
    }
    try {
      await api.addClient(newClient);
      addNotification('تم إضافة العميل بنجاح', 'success');
      setShowAddModal(false);
      setNewClient({ name: '', phone: '', address: '', isCompany: false, creditLimit: 0 });
      load();
    } catch (err) {
      addNotification('فشل إضافة العميل', 'danger');
    }
  };

  const viewStatement = async (client) => {
    try {
      const stmt = await api.getClientStatement(client.id);
      setStatement(stmt);
      setShowStatement(true);
    } catch {
      addNotification('تعذر تحميل كشف الحساب', 'danger');
    }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(filters.search.toLowerCase())
  );

  const totalDeferred = clients.reduce((s, c) => s + c.totalDeferred, 0);
  const atRisk = clients.filter(c => c.creditLimit > 0 && c.totalDeferred >= c.creditLimit * 0.8);

  return (
    <div>
      <div className="page-header">
        <h2>العملاء</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowAddModal(true)}>
          إضافة عميل
        </button>
      </div>
      <FilterBar variant="simple" onReset={resetFilters} activeCount={activeCount}>
        <FilterSearch value={filters.search} onChange={v => setFilter('search', v)} />
      </FilterBar>

      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-label">إجمالي الديون</div>
              <div className="stat-value sv-red">{formatCurrency(totalDeferred)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">عدد العملاء</div>
              <div className="stat-value sv-blue">{clients.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">عملاء تجاوزوا 80%</div>
              <div className="stat-value sv-amber">{atRisk.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">فواتير آجلة</div>
              <div className="stat-value sv-info">{deferredInvoices.length}</div>
            </div>
          </div>

          {atRisk.map(c => (
            <div className="alert alert-warn" key={c.id}>
              <BsExclamationTriangle size={16} />
              <strong>{c.name}</strong> وصل إلى {Math.round((c.totalDeferred / c.creditLimit) * 100)}% من الحد الائتماني
            </div>
          ))}

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>رقم الهاتف</th>
                  <th>النوع</th>
                  <th>إجمالي الديون</th>
                  <th>الحد الائتماني</th>
                  <th>الاستخدام</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const usagePct = c.creditLimit > 0 ? Math.round((c.totalDeferred / c.creditLimit) * 100) : 0;
                  return (
                    <tr key={c.id} onClick={() => setSelectedClient(c)}
                      style={{ cursor: 'pointer', background: selectedClient?.id === c.id ? 'var(--color-surface-alt)' : '' }}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td>{c.phone}</td>
                      <td><Badge label={c.isCompany ? 'شركة' : 'فرد'} color={c.isCompany ? 'info' : 'secondary'} /></td>
                      <td className="mono" style={{ fontWeight: 600, color: c.totalDeferred > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}>
                        {formatCurrency(c.totalDeferred)}
                      </td>
                      <td className="mono">{c.creditLimit > 0 ? formatCurrency(c.creditLimit) : '—'}</td>
                      <td>
                        {c.creditLimit > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 6, background: 'var(--color-bg-alt)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min(usagePct, 100)}%`, background: usagePct >= 80 ? 'var(--color-danger)' : usagePct >= 50 ? 'var(--color-warning)' : 'var(--color-success)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12 }}>{usagePct}%</span>
                          </div>
                        ) : <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <button className="btn-custom btn-custom-outline btn-custom-sm" onClick={(e) => { e.stopPropagation(); viewStatement(c); }}>
                          <BsFileText size={14} /> كشف حساب
                        </button>
                        {c.totalDeferred > 0 && (
                          <button 
                            className="btn-custom btn-custom-accent btn-custom-sm" 
                            style={{ marginRight: 8 }}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setSelectedClient(c);
                              const unpaid = getClientDeferred(c.id).find(di => (di.totalAmount - (di.paidAmount || 0)) > 0);
                              if (unpaid) {
                                setSelectedDi(unpaid.deferredInvoiceId);
                                setShowPayment(true);
                              } else {
                                addNotification('لا توجد فواتير آجلة مفتوحة لهذا العميل', 'info');
                              }
                            }}
                          >
                            <BsCashCoin size={14} /> تحصيل
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {selectedClient && (
            <div className="card" style={{ padding: 20, marginTop: 20 }}>
              <h5 style={{ fontWeight: 600, marginBottom: 16 }}>فواتير {selectedClient.name} الآجلة</h5>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>الفرع</th>
                    <th>المبلغ الأصلي</th>
                    <th>المدفوع</th>
                    <th>المتبقي</th>
                    <th>تاريخ الاستحقاق</th>
                    <th>الحالة</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {getClientDeferred(selectedClient.id).map(di => {
                    const remaining = di.totalAmount - (di.paidAmount || 0);
                    return (
                      <tr key={di.id}>
                        <td>{di.id}</td>
                        <td>{di.branchId}</td>
                        <td className="mono">{formatCurrency(di.totalAmount)}</td>
                        <td className="mono">{formatCurrency(di.paidAmount || 0)}</td>
                        <td className="mono" style={{ color: remaining > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {formatCurrency(remaining)}
                        </td>
                        <td>{di.deferredDueDate ? formatDate(di.deferredDueDate) : '-'}</td>
                        <td><Badge label={remaining <= 0 ? 'مدفوع' : 'غير مدفوع'} color={remaining <= 0 ? 'success' : 'warning'} /></td>
                        <td>
                          {remaining > 0 && (
                            <button className="btn-custom btn-custom-accent btn-custom-sm"
                              onClick={() => { setSelectedDi(di.deferredInvoiceId); setShowPayment(true); }}>
                              <BsCashCoin size={14} /> استلام دفعة
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal show={showPayment} onClose={() => setShowPayment(false)} title="استلام دفعة من العميل">
        {selectedDi && (
          <div style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>المبلغ المتبقي من الفاتورة:</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-danger)' }}>
              {(() => {
                const di = deferredInvoices.find(d => d.id === selectedDi);
                return di ? formatCurrency(di.totalAmount - (di.paidAmount || 0)) : '0';
              })()}
            </div>
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>المبلغ المراد تحصيله</label>
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
          <button className="btn-custom btn-custom-accent" onClick={handlePayment}>تسجيل الدفعة</button>
        </div>
      </Modal>

      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} title="إضافة عميل جديد">
        <div className="grid-2-sm" style={{ gap: 12 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>اسم العميل *</label>
            <input className="form-control-custom" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>رقم الهاتف</label>
            <input className="form-control-custom" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الحد الائتماني</label>
            <input className="form-control-custom" type="number" value={newClient.creditLimit} onChange={e => setNewClient({ ...newClient, creditLimit: e.target.value })} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>العنوان</label>
            <input className="form-control-custom" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={newClient.isCompany} onChange={e => setNewClient({ ...newClient, isCompany: e.target.checked })} />
              هذا العميل يمثل شركة
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-custom btn-custom-outline" onClick={() => setShowAddModal(false)}>إلغاء</button>
          <button className="btn-custom btn-custom-accent" onClick={handleAddClient}>حفظ العميل</button>
        </div>
      </Modal>

      <Modal show={showStatement} onClose={() => setShowStatement(false)} title="كشف حساب" size="lg">
        {statement && (
          <div>
            <h5 style={{ marginBottom: 12 }}>{statement.clientName}</h5>
            <table className="table-custom">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>البيان</th>
                  <th>مدين</th>
                  <th>دائن</th>
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

export default OwnerCustomers;
