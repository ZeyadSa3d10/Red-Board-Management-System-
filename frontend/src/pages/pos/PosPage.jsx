import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api, { INVOICE_TYPES, PAYMENT_METHODS } from '../../api/realApi';
import '../../styles/pos.css';
import ProductGrid from '../../components/pos/ProductGrid';
import PosCart from '../../components/pos/PosCart';
import PosSummary from '../../components/pos/PosSummary';
import PosCheckout from '../../components/pos/PosCheckout';
import AddClientModal from '../../components/pos/AddClientModal';
import { calcInvoiceTotal } from '../../utils/calculations';

const PosPage = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState([]);
  const [invoiceType, setInvoiceType] = useState(INVOICE_TYPES.SALE);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [paymentReference, setPaymentReference] = useState('');
  const [discount, setDiscount] = useState(0);
  const [selectedClient, setSelectedClient] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [relatedInvoiceId, setRelatedInvoiceId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(user?.branchId || '');
  const [sourceBranch, setSourceBranch] = useState(user?.branchId || '');
  const [destBranch, setDestBranch] = useState('');
  const [saving, setSaving] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientPhone, setNewClientPhone] = useState('');
  const [originalInvoice, setOriginalInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnQuery, setReturnQuery] = useState('');
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [transferProductId, setTransferProductId] = useState('');
  const [transferQty, setTransferQty] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [p, c, b, stock] = await Promise.all([
        api.getProducts(),
        api.getClients(),
        api.getBranches(),
        api.getAllStock().catch(() => []),
      ]);
      // Build stock map: productId -> { branchId -> { qty, avgCost } }
      const stockMap = {};
      (stock || []).forEach(s => {
        (s.branchStocks || []).forEach(inv => {
          if (!stockMap[s.id]) stockMap[s.id] = {};
          stockMap[s.id][inv.branchId] = { qty: inv.quantity || 0, avgCost: inv.averageCost || 0 };
        });
      });
      const productsWithStock = p.map(prod => ({
        ...prod,
        stock: stockMap[prod.id] || {},
      }));
      setProducts(productsWithStock);
      setClients(c);
      setBranches(b);
      const branchId = user?.branchId || b[0]?.id || '';
      setSelectedBranch(branchId);
      setSourceBranch(branchId);
      setLoading(false);
    };
    load();
  }, [user]);

  const branchId = invoiceType === INVOICE_TYPES.TRANSFER ? sourceBranch : selectedBranch;

  const productsWithStock = products.map(p => ({
    ...p,
    availableQty: p.stock?.[branchId]?.qty || 0,
    avgCost: p.stock?.[branchId]?.avgCost || 0,
  }));

  const handleSelectProduct = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        qty: 1,
        unitPrice: product.currentSalePrice || 0,
        minSalePrice: product.minSalePrice || 0,
      }];
    });
  }, []);

  const handleUpdateQty = useCallback((idx, newQty) => {
    setCart(prev => prev.map((item, i) =>
      i === idx ? { ...item, qty: Math.max(0, newQty) } : item
    ));
  }, []);

  const handleUpdatePrice = useCallback((idx, newPrice) => {
    setCart(prev => prev.map((item, i) =>
      i === idx ? { ...item, unitPrice: newPrice } : item
    ));
  }, []);

  const handleRemoveItem = useCallback((idx) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const resetCart = () => {
    setCart([]);
    setDiscount(0);
    setNotes('');
    setSelectedClient('');
    setDueDate('');
    setRelatedInvoiceId('');
    setCompletedInvoice(null);
    setInvoiceType(INVOICE_TYPES.SALE);
    setPaymentMethod(PAYMENT_METHODS.CASH);
    setOriginalInvoice(null);
    setReturnItems([]);
    setReturnQuery('');
  };
 
  const handleClientAdded = (newClient) => {
    setClients(prev => [...prev, newClient]);
    setSelectedClient(newClient.id || newClient.Id);
    setNewClientPhone('');
  };

  const handleInvoiceTypeChange = (type) => {
    setInvoiceType(type);
    setOriginalInvoice(null);
    setReturnItems([]);
    setReturnQuery('');
  };

  const handleFetchOriginalInvoice = async () => {
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
          unitPrice: Number(item.unitPrice || 0),
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

  const handleAddTransferItem = () => {
    if (!transferProductId) {
      addNotification('اختر منتج', 'danger');
      return;
    }
    const product = productsWithStock.find(p => p.id === Number(transferProductId));
    if (!product) return;
    const qty = Number(transferQty);
    if (qty <= 0) {
      addNotification('الكمية يجب أن تكون أكبر من 0', 'danger');
      return;
    }
    if (qty > product.availableQty) {
      addNotification(`الكمية المطلوبة من ${product.name} تتجاوز المخزون المتاح (${product.availableQty})`, 'danger');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        const newQty = existing.qty + qty;
        if (newQty > product.availableQty) {
          addNotification(`الكمية المطلوبة تتجاوز المخزون المتاح (${product.availableQty})`, 'danger');
          return prev;
        }
        return prev.map(i =>
          i.productId === product.id ? { ...i, qty: newQty } : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        qty,
        unitPrice: 0,
        minSalePrice: 0,
      }];
    });
    setTransferProductId('');
    setTransferQty(1);
  };

  const getProductById = (productId) => productsWithStock.find(p => p.id === productId);

  const handleSave = async (shouldPrint = false) => {
    if (invoiceType === INVOICE_TYPES.RETURN_SALE || invoiceType === INVOICE_TYPES.RETURN_DEFERRED) {
      if (!originalInvoice) {
        addNotification('يرجى البحث عن الفاتورة الأصلية', 'danger');
        return;
      }
      const items = returnItems.filter(i => i.qty > 0);
      if (items.length === 0) {
        addNotification('اختر منتجات للإرجاع', 'danger');
        return;
      }
      setSaving(true);
      try {
        const result = await api.createInvoice({
          type: invoiceType,
          branchId: selectedBranch || user?.branchId,
          relatedInvoiceId: Number(originalInvoice.id),
          items: items.map(i => ({ productId: i.productId, qty: i.qty })),
          paymentMethod: invoiceType === INVOICE_TYPES.RETURN_SALE ? paymentMethod : undefined,
          notes: `مرتجع من فاتورة #${originalInvoice.invoiceNumber || originalInvoice.id}` + (notes ? ` - ${notes}` : ''),
        });
        setSaving(false);
        addNotification('تم تسجيل المرتجع بنجاح', 'success');
        setCompletedInvoice(result);
        try {
          const stock = await api.getAllStock();
          const stockMap = {};
          (stock || []).forEach(s => {
            (s.branchStocks || []).forEach(inv => {
              if (!stockMap[s.id]) stockMap[s.id] = {};
              stockMap[s.id][inv.branchId] = { qty: inv.quantity || 0, avgCost: inv.averageCost || 0 };
            });
          });
          setProducts(prev => prev.map(prod => ({
            ...prod,
            stock: stockMap[prod.id] || {},
          })));
        } catch { }
        if (!shouldPrint) resetCart();
      } catch (err) {
        setSaving(false);
        addNotification(err?.message || 'فشل في تسجيل المرتجع', 'danger');
      }
      return;
    }

    if (cart.length === 0) {
      addNotification('الفاتورة فارغة، أضف منتجات أولاً', 'danger');
      return;
    }

    if (invoiceType === INVOICE_TYPES.TRANSFER) {
      if (!sourceBranch || !destBranch) {
        addNotification('يرجى اختيار فرع المصدر والوجهة', 'danger');
        return;
      }
      const data = {
        type: INVOICE_TYPES.TRANSFER,
        sourceBranchId: sourceBranch,
        destinationBranchId: destBranch,
        items: cart.map(i => ({
          productId: i.productId,
          qty: i.qty,
          unitCost: getProductById(i.productId)?.avgCost || 0,
        })),
        notes,
      };
      setSaving(true);
      try {
        const result = await api.createTransfer(data);
        setSaving(false);
        addNotification('تم إنشاء إذن التحويل بنجاح', 'success');
        resetCart();
      } catch (err) {
        setSaving(false);
        console.error('Transfer save error:', err);
        addNotification(err?.message || 'فشل في حفظ التحويل', 'danger');
      }
      return;
    }

    if (!selectedBranch && user?.role === 'owner') {
      addNotification('يرجى اختيار الفرع', 'danger');
      return;
    }

    if ((invoiceType === INVOICE_TYPES.SALE_DEFERRED || invoiceType === INVOICE_TYPES.RETURN_DEFERRED) && !selectedClient) {
      addNotification('يرجى اختيار عميل للفاتورة الآجلة', 'danger');
      return;
    }

    if ((invoiceType === INVOICE_TYPES.SALE_DEFERRED || invoiceType === INVOICE_TYPES.RETURN_DEFERRED) && selectedClient) {
      const client = clients.find(c => c.id === selectedClient);
      if (client && !client.phone) {
        addNotification('يجب إضافة رقم هاتف للعميل قبل إنشاء فاتورة آجلة', 'danger');
        return;
      }
    }

    for (const item of cart) {
      const product = getProductById(item.productId);
      if (!product) continue;
      if (item.qty > product.availableQty) {
        addNotification(`الكمية المطلوبة من ${item.productName} تتجاوز المخزون المتاح (${product.availableQty})`, 'danger');
        return;
      }
      if (item.unitPrice < (item.minSalePrice || 0)) {
        addNotification(`سعر ${item.productName} أقل من الحد المسموح`, 'danger');
        return;
      }
    }

    const itemsForInvoice = cart.map(item => ({
      productId: item.productId,
      qty: item.qty,
      unitPrice: item.unitPrice,
    }));

    const totals = calcInvoiceTotal(itemsForInvoice, Number(discount));

    const clientObj = clients.find(c => c.id === selectedClient);
    const invoiceData = {
      type: invoiceType,
      branchId: invoiceType !== INVOICE_TYPES.TRANSFER ? selectedBranch || user?.branchId : null,
      clientId: [INVOICE_TYPES.SALE_DEFERRED, INVOICE_TYPES.RETURN_DEFERRED].includes(invoiceType) ? selectedClient : null,
      clientName: clientObj?.name || 'عميل نقدي',
      items: itemsForInvoice,
      subtotal: totals.subtotal,
      discount: Number(discount),
      totalAmount: totals.total,
      paymentMethod: [INVOICE_TYPES.SALE, INVOICE_TYPES.RETURN_SALE].includes(invoiceType) ? paymentMethod : null,
      paymentReference: (paymentMethod === PAYMENT_METHODS.CHECK || paymentMethod === PAYMENT_METHODS.BANK_TRANSFER || paymentMethod === PAYMENT_METHODS.VODAFONE_CASH) ? paymentReference : null,
      deferredDueDate: invoiceType === INVOICE_TYPES.SALE_DEFERRED ? dueDate : null,
      relatedInvoiceId: [INVOICE_TYPES.RETURN_SALE, INVOICE_TYPES.RETURN_DEFERRED].includes(invoiceType) ? Number(relatedInvoiceId) : null,
      notes,
    };

    setSaving(true);
    try {
      const result = await api.createInvoice(invoiceData);
      setSaving(false);
      addNotification('تم حفظ الفاتورة بنجاح', 'success');
      setCompletedInvoice(result);
      // Refresh inventory stock after sale
      try {
        const stock = await api.getAllStock();
        const stockMap = {};
        (stock || []).forEach(s => {
          (s.branchStocks || []).forEach(inv => {
            if (!stockMap[s.id]) stockMap[s.id] = {};
            stockMap[s.id][inv.branchId] = { qty: inv.quantity || 0, avgCost: inv.averageCost || 0 };
          });
        });
        setProducts(prev => prev.map(prod => ({
          ...prod,
          stock: stockMap[prod.id] || {},
        })));
      } catch { /* stock refresh failed silently */ }
      if (!shouldPrint) resetCart();
    } catch (err) {
      setSaving(false);
      console.error('Save error:', err);
      addNotification(err?.message || 'فشل في حفظ الفاتورة', 'danger');
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border" />
      </div>
    );
  }

  return (
    <>
    <div className="pos-body">
      {(invoiceType === INVOICE_TYPES.RETURN_SALE || invoiceType === INVOICE_TYPES.RETURN_DEFERRED) ? (
        <div className="pos-left" style={{ padding: 16, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input className="form-control-custom" placeholder="رقم الفاتورة الأصلية (مثال: INV-2026201)"
              value={returnQuery} onChange={e => setReturnQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetchOriginalInvoice()}
              style={{ flex: 1 }} />
            <button className="btn-custom btn-custom-primary" onClick={handleFetchOriginalInvoice} disabled={loadingOriginal}>
              {loadingOriginal ? 'جاري البحث...' : 'بحث'}
            </button>
          </div>
          {!originalInvoice && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              أدخل رقم الفاتورة الأصلية واضغط بحث
            </div>
          )}
          {originalInvoice && (
            <>
              <div className="card" style={{ padding: 12, marginBottom: 16, background: 'var(--color-bg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.85rem' }}>
                  <div><strong>الفاتورة:</strong> #{originalInvoice.invoiceNumber || originalInvoice.id}</div>
                  <div><strong>التاريخ:</strong> {new Date(originalInvoice.createdAt).toLocaleDateString('ar-EG')}</div>
                  <div><strong>العميل:</strong> {originalInvoice.clientName || 'نقدي'}</div>
                  <div><strong>الإجمالي:</strong> {Number(originalInvoice.totalAmount).toLocaleString()}</div>
                </div>
              </div>
              <table className="table-custom">
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
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-success, #16a34a)', fontWeight: 500 }}>✅ تم الاسترجاع كلياً</span>
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
            </>
          )}
        </div>
      ) : invoiceType === INVOICE_TYPES.TRANSFER ? (
        <div className="pos-left" style={{ padding: 16, overflowY: 'auto' }}>
          <div className="card" style={{ padding: 12, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.9rem' }}>إضافة صنف للتحويل</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <select className="form-control-custom" style={{ flex: 1 }} value={transferProductId} onChange={e => setTransferProductId(e.target.value)}>
                <option value="">اختر المنتج</option>
                {productsWithStock.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (المتوفر: {p.availableQty})
                  </option>
                ))}
              </select>
              <input className="form-control-custom" type="number" min="1"
                value={transferQty} onChange={e => setTransferQty(e.target.value)}
                style={{ width: 80 }} />
              <button className="btn-custom btn-custom-primary" onClick={handleAddTransferItem}
                style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}>
                إضافة
              </button>
            </div>
            {transferProductId && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                {(() => {
                  const p = productsWithStock.find(x => x.id === Number(transferProductId));
                  return p ? `المخزون المتاح: ${p.availableQty}` : '';
                })()}
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            {cart.length > 0 ? `${cart.length} صنف مضافة للتحويل` : 'لم يتم إضافة أصناف بعد'}
          </div>
        </div>
      ) : (
        <div className="pos-left">
          <ProductGrid
            products={productsWithStock}
            onSelectProduct={handleSelectProduct}
          />
        </div>
      )}
      <div className="pos-right">
        <PosSummary
          invoiceType={invoiceType}
          setInvoiceType={handleInvoiceTypeChange}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          selectedClient={selectedClient}
          setSelectedClient={setSelectedClient}
          dueDate={dueDate}
          setDueDate={setDueDate}
          clients={clients}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          branches={branches}
          user={user}
            onAddClientClick={(phone) => { setNewClientPhone(phone || ''); setIsClientModalOpen(true); }}
        />
        {(invoiceType === INVOICE_TYPES.SALE || invoiceType === INVOICE_TYPES.RETURN_SALE) && (paymentMethod === PAYMENT_METHODS.VODAFONE_CASH || paymentMethod === PAYMENT_METHODS.BANK_TRANSFER || paymentMethod === PAYMENT_METHODS.CHECK) && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4, color: 'var(--color-text-secondary)' }}>
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
              }
              style={{ width: '100%' }} />
          </div>
        )}
        {(invoiceType === INVOICE_TYPES.RETURN_SALE || invoiceType === INVOICE_TYPES.RETURN_DEFERRED) ? (
          originalInvoice ? (
            <>
              <div className="pos-notes">
                <textarea rows="1" placeholder="ملاحظات..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="pos-summary">
                <div className="pos-summary-row total">
                  <span>إجمالي المرتجع</span>
                  <span className="mono" style={{ color: 'var(--color-danger)' }}>
                    {returnItems.filter(i => i.qty > 0).reduce((s, i) => s + i.qty * i.unitPrice, 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="pos-save-actions">
                <button className="pos-btn-cancel" onClick={resetCart} disabled={saving}>
                  إلغاء
                </button>
                <button className="pos-btn-save" onClick={() => handleSave(false)} disabled={saving || returnItems.every(i => i.qty === 0)}>
                  {saving ? 'جاري الحفظ...' : '💾 حفظ المرتجع'}
                </button>
                <button className="pos-btn-save-print" onClick={() => handleSave(true)} disabled={saving || returnItems.every(i => i.qty === 0)}>
                  {saving ? 'جاري الحفظ...' : '🖨️ حفظ وطباعة'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
              ابحث عن الفاتورة الأصلية لبدء المرتجع
            </div>
          )
        ) : invoiceType === INVOICE_TYPES.TRANSFER ? (
          <>
            <PosCart
              items={cart}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleRemoveItem}
              onUpdatePrice={handleUpdatePrice}
              simple
            />
            <div className="pos-notes">
              <textarea rows="1" placeholder="ملاحظات..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="pos-save-actions">
              <button className="pos-btn-cancel" onClick={resetCart} disabled={saving || cart.length === 0}>
                إلغاء
              </button>
              <button className="pos-btn-save" onClick={() => handleSave(false)} disabled={saving || cart.length === 0}>
                {saving ? 'جاري الحفظ...' : '💾 حفظ التحويل'}
              </button>
            </div>
          </>
        ) : (
          <>
            <PosCart
              items={cart}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleRemoveItem}
              onUpdatePrice={handleUpdatePrice}
            />
            <div className="pos-notes">
              <textarea rows="1" placeholder="ملاحظات..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            {cart.length > 0 && invoiceType !== INVOICE_TYPES.TRANSFER && (
              <div className="pos-summary">
                <div className="pos-summary-row">
                  <span>المجموع الفرعي</span>
                  <span className="mono">{cart.reduce((s, i) => s + i.qty * i.unitPrice, 0).toLocaleString()}</span>
                </div>
                <div className="pos-summary-row">
                  <span>الخصم</span>
                  <input className="pos-summary-input" type="number" min="0" value={discount || ''} onChange={e => setDiscount(e.target.value === '' ? 0 : Number(e.target.value))} placeholder="0" />
                </div>
                <div className="pos-summary-row total">
                  <span>الإجمالي</span>
                  <span className="mono">{Math.max(0, cart.reduce((s, i) => s + i.qty * i.unitPrice, 0) - (Number(discount) || 0)).toLocaleString()}</span>
                </div>
              </div>
            )}
            <div className="pos-save-actions">
              <button className="pos-btn-cancel" onClick={resetCart} disabled={saving || cart.length === 0}>
                إلغاء
              </button>
              <button className="pos-btn-save" onClick={() => handleSave(false)} disabled={saving || cart.length === 0}>
                {saving ? 'جاري الحفظ...' : '💾 حفظ'}
              </button>
              <button className="pos-btn-save-print" onClick={() => handleSave(true)} disabled={saving || cart.length === 0}>
                {saving ? 'جاري الحفظ...' : '🖨️ حفظ وطباعة'}
              </button>
            </div>
          </>
        )}
      </div>
      </div>

      {completedInvoice && (
        <PosCheckout
          invoice={completedInvoice}
          onNewInvoice={resetCart}
        />
      )}

      <AddClientModal
        show={isClientModalOpen}
        initialPhone={newClientPhone}
        onClose={() => { setIsClientModalOpen(false); setNewClientPhone(''); }}
        onClientAdded={handleClientAdded}
      />
    </>
  );
};

export default PosPage;
