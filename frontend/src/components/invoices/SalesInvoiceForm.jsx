import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api, { INVOICE_TYPES, PAYMENT_METHODS } from '../../api/realApi';
import { formatCurrency } from '../../utils/formatters';
import { calcInvoiceTotal } from '../../utils/calculations';
import { BsTrash, BsPlus, BsSave, BsPrinter } from 'react-icons/bs';

const SalesInvoiceForm = ({ onComplete }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [invoiceType, setInvoiceType] = useState(INVOICE_TYPES.SALE);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedClient, setSelectedClient] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(user?.branchId || '');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [dueDate, setDueDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [transportCost, setTransportCost] = useState(0);
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', qty: 1, unitPrice: 0 }]);
  const [sourceBranch, setSourceBranch] = useState(user?.branchId || '');
  const [destBranch, setDestBranch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [p, c, b] = await Promise.all([
        api.getProducts(), api.getClients(),
        api.getBranches(),
      ]);
      setProducts(p);
      setClients(c);
      setBranches(b);
      setSelectedBranch(user?.branchId || b[0]?.id || '');
      setSourceBranch(user?.branchId || b[0]?.id || '');
    };
    load();
  }, [user]);

  const availableProducts = useMemo(() => {
    const branchId = invoiceType === INVOICE_TYPES.TRANSFER ? sourceBranch : selectedBranch;
    return products.map(p => ({
      ...p,
      availableQty: p.stock?.[branchId]?.qty || 0,
      avgCost: p.stock?.[branchId]?.avgCost || 0,
    }));
  }, [products, selectedBranch, sourceBranch, invoiceType]);

  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'productId') {
        const product = availableProducts.find(p => p.id === value);
        if (product) {
          updated[idx].unitPrice = product.currentSalePrice || 0;
        }
      }
      if (field === 'productId' && invoiceType === INVOICE_TYPES.TRANSFER) {
        const product = availableProducts.find(p => p.id === value);
        if (product) {
          updated[idx].unitCost = product.avgCost || 0;
        }
      }
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { productId: '', qty: 1, unitPrice: 0 }]);
  };

  const removeItem = (idx) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totals = useMemo(() => {
    const invoiceItems = items.map(item => {
      return {
        ...item,
        unitPrice: item.unitPrice || product?.currentSalePrice || 0,
        totalPrice: item.qty * (item.unitPrice || product?.currentSalePrice || 0),
      };
    });
    const base = calcInvoiceTotal(invoiceItems, Number(discount));
    return { ...base, total: base.total + Number(transportCost) };
  }, [items, discount, transportCost, availableProducts, invoiceType]);

  const getSelectedProduct = (productId) => availableProducts.find(p => p.id === productId);

  const handleSave = async () => {
    if (items.some(i => !i.productId)) {
      addNotification('يرجى اختيار منتج لكل بند', 'danger');
      return;
    }

    if (invoiceType === INVOICE_TYPES.TRANSFER) {
      if (!sourceBranch || !destBranch) {
        addNotification('يرجى اختيار فرع المصدر والوجهة', 'danger');
        return;
      }
      const invoiceData = {
        type: INVOICE_TYPES.TRANSFER,
        sourceBranchId: sourceBranch,
        destinationBranchId: destBranch,
        items: items.map(i => ({ productId: i.productId, qty: i.qty, unitCost: getSelectedProduct(i.productId)?.avgCost || 0 })),
        createdBy: user.id,
        notes,
        status: 'completed',
      };
      setSaving(true);
      await api.createTransfer(invoiceData);
      setSaving(false);
      addNotification('تم إنشاء إذن التحويل بنجاح', 'success');
      onComplete?.();
      return;
    }

    if (!selectedBranch) {
      addNotification('يرجى اختيار الفرع', 'danger');
      return;
    }

    if (invoiceType === INVOICE_TYPES.SALE_DEFERRED && !selectedClient) {
      addNotification('يرجى اختيار عميل للفاتورة الآجلة', 'danger');
      return;
    }

    for (const item of items) {
      const product = getSelectedProduct(item.productId);
      if (!product) continue;
      if (item.qty > product.availableQty) {
        addNotification(`الكمية المطلوبة من ${product.name} تتجاوز المخزون المتاح`, 'danger');
        return;
      }
      if (item.unitPrice < product.minSalePrice) {
        addNotification(`سعر ${product.name} أقل من الحد المسموح (${formatCurrency(product.minSalePrice)})`, 'danger');
        return;
      }
    }

    const invoiceData = {
      type: invoiceType,
      branchId: selectedBranch,
      clientId: [INVOICE_TYPES.SALE_DEFERRED, INVOICE_TYPES.RETURN_DEFERRED].includes(invoiceType) ? selectedClient : null,
      clientName: selectedClient ? clients.find(c => c.id === selectedClient)?.name : 'عميل نقدي',
      items: items.map(i => ({
        productId: i.productId,
        qty: i.qty,
        unitPrice: i.unitPrice || getSelectedProduct(i.productId)?.currentSalePrice || 0,
        totalPrice: i.qty * (i.unitPrice || getSelectedProduct(i.productId)?.currentSalePrice || 0),
      })),
      subtotal: totals.subtotal,
      discount: Number(discount),
      transportCost: Number(transportCost),
      totalAmount: totals.total,
      paymentMethod: invoiceType === INVOICE_TYPES.SALE ? paymentMethod : null,
      paymentReference: paymentMethod === 'check' || paymentMethod === 'bank_transfer' || paymentMethod === 'vodafone_cash' ? paymentReference : null,
      deferredDueDate: invoiceType === INVOICE_TYPES.SALE_DEFERRED ? dueDate : null,
      createdBy: user.id,
      notes,
    };

    setSaving(true);
    await api.createInvoice(invoiceData);
    setSaving(false);
    addNotification('تم حفظ الفاتورة بنجاح', 'success');
    onComplete?.();
  };

  return (
    <div className="card" style={{ padding: 24 }}>
      <h4 style={{ marginBottom: 20, fontWeight: 600 }}>فاتورة جديدة</h4>

      {/* نوع الفاتورة */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>نوع الفاتورة</label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { value: INVOICE_TYPES.SALE, label: 'بيع نقدي' },
            { value: INVOICE_TYPES.SALE_DEFERRED, label: 'بيع آجل' },
            { value: INVOICE_TYPES.RETURN_SALE, label: 'مرتجع مبيعات' },
            { value: INVOICE_TYPES.TRANSFER, label: 'إذن تحويل' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setInvoiceType(t.value)}
              className={`btn-custom ${invoiceType === t.value ? 'btn-custom-accent' : 'btn-custom-outline'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* اختيارات إضافية حسب النوع */}
      <div className="grid-2-sm" style={{ gap: 16, marginBottom: 20 }}>
        {invoiceType !== INVOICE_TYPES.TRANSFER && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الفرع</label>
              {user?.role === 'owner' ? (
                <select className="form-control-custom" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                  {branches.filter(b => !b.isAdmin).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <div style={{ padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                  {branches.find(b => b.id === user?.branchId)?.name || 'الفرع الحالي'}
                </div>
              )}
            </div>
            {[INVOICE_TYPES.SALE_DEFERRED, INVOICE_TYPES.RETURN_DEFERRED].includes(invoiceType) && (
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>العميل</label>
                <select className="form-control-custom" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                  <option value="">اختر العميل</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {invoiceType === INVOICE_TYPES.SALE_DEFERRED && (
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>تاريخ الاستحقاق</label>
                <input className="form-control-custom" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            )}
            {false && null}
          </>
        )}
        {invoiceType === INVOICE_TYPES.TRANSFER && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>من فرع</label>
              <select className="form-control-custom" value={sourceBranch} onChange={e => setSourceBranch(e.target.value)}>
                {branches.filter(b => !b.isAdmin).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>إلى فرع</label>
              <select className="form-control-custom" value={destBranch} onChange={e => setDestBranch(e.target.value)}>
                <option value="">اختر الفرع</option>
                {branches.filter(b => !b.isAdmin && b.id !== sourceBranch).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {/* بنود الفاتورة */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h5 style={{ margin: 0, fontWeight: 600 }}>بنود الفاتورة</h5>
          <button className="btn-custom btn-custom-accent btn-custom-sm" onClick={addItem}>
            <BsPlus size={18} /> إضافة بند
          </button>
        </div>
        <table className="table-custom">
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              {invoiceType !== INVOICE_TYPES.TRANSFER && <th>سعر الوحدة</th>}
              {invoiceType === INVOICE_TYPES.TRANSFER && <th>متوسط التكلفة</th>}
              {invoiceType !== INVOICE_TYPES.TRANSFER && <th>الإجمالي</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const product = getSelectedProduct(item.productId);
              const totalPrice = (item.qty || 0) * (item.unitPrice || 0);
              return (
                <tr key={idx}>
                  <td>
                    <select className="form-control-custom" value={item.productId} onChange={e => handleItemChange(idx, 'productId', e.target.value)}>
                      <option value="">اختر منتج</option>
                      {availableProducts.filter(p => p.availableQty > 0).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (متاح: {p.availableQty})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className="form-control-custom" type="number" min="1" value={item.qty}
                      onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))} />
                  </td>
                  {invoiceType !== INVOICE_TYPES.TRANSFER && (
                    <td>
                      <input className="form-control-custom" type="number" min="0" value={item.unitPrice}
                        onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))} />
                    </td>
                  )}
                  {invoiceType === INVOICE_TYPES.TRANSFER && (
                    <td>
                      <span className="mono">{product ? formatCurrency(product.avgCost) : '-'}</span>
                    </td>
                  )}
                  {invoiceType !== INVOICE_TYPES.TRANSFER && (
                    <td><span className="mono">{formatCurrency(totalPrice)}</span></td>
                  )}
                  <td>
                    <button className="btn-custom btn-custom-danger btn-custom-sm" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                      <BsTrash />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* الملخص */}
      {invoiceType !== INVOICE_TYPES.TRANSFER && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ width: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>المجموع الفرعي:</span>
              <span className="mono">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>الخصم:</span>
              <input className="form-control-custom" type="number" min="0" value={discount}
                onChange={e => setDiscount(Number(e.target.value))} style={{ width: 120, textAlign: 'left' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span>سعر النقل:</span>
              <input className="form-control-custom" type="number" min="0" value={transportCost}
                onChange={e => setTransportCost(Number(e.target.value))} style={{ width: 120, textAlign: 'left' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 700, fontSize: '1.1rem' }}>
              <span>الإجمالي:</span>
              <span className="mono" style={{ color: 'var(--color-accent)' }}>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* طريقة الدفع */}
      {invoiceType === INVOICE_TYPES.SALE && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>طريقة الدفع</label>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { value: PAYMENT_METHODS.CASH, label: 'نقدي' },
              { value: PAYMENT_METHODS.BANK_TRANSFER, label: 'تحويل بنكي' },
              { value: PAYMENT_METHODS.CHECK, label: 'شيك' },
              { value: PAYMENT_METHODS.VODAFONE_CASH, label: 'فودافون كاش' },
            ].map(pm => (
              <button
                key={pm.value}
                onClick={() => setPaymentMethod(pm.value)}
                className={`btn-custom ${paymentMethod === pm.value ? 'btn-custom-accent' : 'btn-custom-outline'}`}
              >
                {pm.label}
              </button>
            ))}
          </div>
          {(paymentMethod === PAYMENT_METHODS.CHECK || paymentMethod === PAYMENT_METHODS.BANK_TRANSFER || paymentMethod === PAYMENT_METHODS.VODAFONE_CASH) && (
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
                {paymentMethod === PAYMENT_METHODS.VODAFONE_CASH && 'رقم الموبايل المحول إليه'}
                {paymentMethod === PAYMENT_METHODS.BANK_TRANSFER && 'اسم المحول إليه'}
                {paymentMethod === PAYMENT_METHODS.CHECK && 'رقم الشيك'}
              </label>
              <input className="form-control-custom" type="text" value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder={
                  paymentMethod === PAYMENT_METHODS.VODAFONE_CASH ? 'أدخل رقم الموبايل' :
                  paymentMethod === PAYMENT_METHODS.BANK_TRANSFER ? 'أدخل الاسم' :
                  'أدخل رقم الشيك'
                } />
            </div>
          )}
        </div>
      )}

      {/* ملاحظات */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>ملاحظات</label>
        <textarea className="form-control-custom" rows="2" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      {/* أزرار الحفظ */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="btn-custom btn-custom-primary" onClick={handleSave} disabled={saving}>
          <BsSave size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
        </button>
      </div>
    </div>
  );
};

export default SalesInvoiceForm;
