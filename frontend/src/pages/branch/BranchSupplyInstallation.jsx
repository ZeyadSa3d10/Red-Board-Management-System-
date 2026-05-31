import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api, { INVOICE_TYPES } from '../../api/realApi';
import ProductGrid from '../../components/pos/ProductGrid';
import { BsTrash, BsSearch, BsArrowReturnLeft } from 'react-icons/bs';

const BranchSupplyInstallation = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Create mode state
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(user?.branchId || '');
  const [saving, setSaving] = useState(false);

  // Return mode state
  const [returnMode, setReturnMode] = useState(false);
  const [returnQuery, setReturnQuery] = useState('');
  const [originalInvoice, setOriginalInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [p, b, stock] = await Promise.all([
        api.getProducts(),
        api.getBranches(),
        api.getAllStock().catch(() => []),
      ]);
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
      setBranches(b);
      const branchId = user?.branchId || b[0]?.id || '';
      setSelectedBranch(branchId);
      setLoading(false);
    };
    load();
  }, [user]);

  const branchId = selectedBranch;
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
        unit: product.unit || '',
      }];
    });
  }, []);

  const handleUpdateQty = useCallback((idx, newQty) => {
    setCart(prev => prev.map((item, i) =>
      i === idx ? { ...item, qty: Math.max(0, newQty) } : item
    ));
  }, []);

  const handleRemoveItem = useCallback((idx) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const resetCart = () => {
    setCart([]);
    setProjectName('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      addNotification('يرجى إدخال اسم المشروع', 'danger');
      return;
    }
    if (cart.length === 0) {
      addNotification('لم يتم إضافة منتجات', 'danger');
      return;
    }
    if (!selectedBranch) {
      addNotification('يرجى اختيار الفرع', 'danger');
      return;
    }

    setSaving(true);
    try {
      await api.createInvoice({
        type: INVOICE_TYPES.SUPPLY_INSTALLATION,
        branchId: selectedBranch,
        projectName: projectName.trim(),
        items: cart.map(i => ({
          productId: i.productId,
          qty: i.qty,
        })),
        notes,
      });
      addNotification('تم حفظ فاتورة التوريد والتركيب بنجاح', 'success');
      resetCart();
    } catch (err) {
      addNotification(err?.message || 'فشل في حفظ الفاتورة', 'danger');
    }
    setSaving(false);
  };

  const handleFetchOriginal = async () => {
    const q = returnQuery.trim();
    if (!q) { addNotification('يرجى إدخال رقم الفاتورة', 'danger'); return; }
    setLoadingOriginal(true);
    setOriginalInvoice(null);
    setReturnItems([]);
    setSuccess(null);
    try {
      const isNumeric = /^\d+$/.test(q);
      const inv = isNumeric ? await api.getInvoiceById(Number(q)) : await api.getInvoiceByNumber(q);
      if (inv.type !== 'supply_installation') {
        addNotification('يرجى إدخال رقم فاتورة توريد وتركيب', 'danger');
        setLoadingOriginal(false);
        return;
      }

      // Fetch existing returns to calculate remaining quantities
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
      const result = await api.createInvoice({
        type: INVOICE_TYPES.RETURN_SUPPLY_INSTALLATION,
        branchId: user?.branchId || originalInvoice.branchId,
        relatedInvoiceId: Number(originalInvoice.id),
        items: items.map(i => ({ productId: i.productId, qty: i.qty })),
        notes: `مرتجع من فاتورة توريد وتركيب #${originalInvoice.invoiceNumber || originalInvoice.id}`,
      });
      setSuccess(result);
      addNotification('تم تسجيل مرتجع التوريد والتركيب بنجاح', 'success');
    } catch (err) {
      addNotification(err?.message || 'فشل في تسجيل المرتجع', 'danger');
    }
    setSaving(false);
  };

  const resetReturn = () => {
    setReturnQuery('');
    setOriginalInvoice(null);
    setReturnItems([]);
    setSuccess(null);
  };

  const switchToReturn = () => {
    setReturnMode(true);
    resetCart();
    setSuccess(null);
  };

  const switchToCreate = () => {
    setReturnMode(false);
    resetReturn();
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border" />
      </div>
    );
  }

  return (
    <div className="pos-body">
      <div className="pos-left">
        {!returnMode && (
          <ProductGrid
            products={productsWithStock}
            onSelectProduct={handleSelectProduct}
          />
        )}
      </div>
      <div className="pos-right">
        <div className="pos-cart-header">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className={`btn-custom btn-custom-sm ${!returnMode ? 'btn-custom-accent' : 'btn-custom-outline'}`}
              onClick={switchToCreate}>
              توريد وتركيب
            </button>
            <button className={`btn-custom btn-custom-sm ${returnMode ? 'btn-custom-accent' : 'btn-custom-outline'}`}
              onClick={switchToReturn}>
              <BsArrowReturnLeft size={14} style={{ marginLeft: 4 }} />مرتجع
            </button>
          </div>
          {!returnMode && (
            <span className="pos-cart-count">{cart.reduce((s, i) => s + i.qty, 0)}</span>
          )}
        </div>

        {!returnMode ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4, color: 'var(--color-text-secondary)' }}>اسم المشروع</label>
              <input className="form-control-custom" type="text" placeholder="اسم المشروع..."
                value={projectName} onChange={e => setProjectName(e.target.value)}
                style={{ width: '100%' }} />
            </div>

            <div className="pos-cart-items">
              {cart.length === 0 ? (
                <div className="pos-cart-empty">
                  اختر منتجات من القائمة
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={item.productId} className="pos-cart-item">
                    <div className="pos-cart-item-info">
                      <div className="pos-cart-item-name">{item.productName}</div>
                    </div>
                    <div className="pos-cart-item-qty">
                      <button className="pos-cart-qty-btn minus" onClick={() => handleUpdateQty(idx, item.qty - 1)}>-</button>
                      <input className="pos-cart-qty-input" type="number" min="0" value={item.qty}
                        onChange={e => handleUpdateQty(idx, Math.max(0, Number(e.target.value)))} />
                      <button className="pos-cart-qty-btn" onClick={() => handleUpdateQty(idx, item.qty + 1)}>+</button>
                    </div>
                    <button className="pos-cart-item-remove" onClick={() => handleRemoveItem(idx)} title="حذف">
                      <BsTrash size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pos-notes">
              <textarea rows="1" placeholder="ملاحظات..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="pos-summary">
              <div className="pos-summary-row">
                <span>عدد الأصناف</span>
                <span className="mono">{cart.length}</span>
              </div>
              <div className="pos-summary-row">
                <span>إجمالي القطع</span>
                <span className="mono">{cart.reduce((s, i) => s + i.qty, 0)}</span>
              </div>
            </div>

            <div className="pos-save-actions" style={{ borderTop: 'none' }}>
              <button className="pos-btn-cancel" onClick={resetCart} disabled={saving || cart.length === 0}>
                إلغاء
              </button>
              <button className="pos-btn-save" onClick={handleSave} disabled={saving || cart.length === 0}>
                {saving ? 'جاري الحفظ...' : '💾 حفظ'}
              </button>
            </div>
          </>
        ) : (
          <>
            {!success && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input className="form-control-custom" placeholder="رقم فاتورة التوريد والتركيب (مثال: SUP-2026-000001)"
                    value={returnQuery} onChange={e => setReturnQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFetchOriginal()}
                    style={{ flex: 1 }} />
                  <button className="btn-custom btn-custom-primary btn-custom-sm" onClick={handleFetchOriginal} disabled={loadingOriginal}>
                    {loadingOriginal ? '...' : <BsSearch size={14} />}
                  </button>
                </div>
              </div>
            )}

            {originalInvoice && !success && (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span><strong>فاتورة:</strong> #{originalInvoice.invoiceNumber}</span>
                    <span><strong>المشروع:</strong> {originalInvoice.projectName || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>التاريخ:</strong> {new Date(originalInvoice.createdAt).toLocaleDateString('ar-EG')}</span>
                    <span><strong>الفرع:</strong> {originalInvoice.branchName}</span>
                  </div>
                </div>

                <div className="pos-cart-items">
                  {returnItems.map((item, idx) => (
                    <div key={item.productId} className="pos-cart-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, opacity: item.fullyReturned ? 0.5 : 1 }}>
                      <div className="pos-cart-item-name">{item.productName}</div>
                      {item.fullyReturned ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-success, #16a34a)', fontWeight: 500 }}>✅ تم الاسترجاع كلياً</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>متاح: {item.maxQty}</span>
                          <input type="number" min="0" max={item.maxQty} value={item.qty}
                          onChange={e => handleReturnQtyChange(idx, e.target.value)}
                          style={{ width: 80, padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-numbers)' }} />
                         <div className="pos-cart-item-qty">
                           <button className="pos-cart-qty-btn minus" onClick={() => handleReturnQtyChange(idx, item.qty - 1)}>-</button>
                           <button className="pos-cart-qty-btn" onClick={() => handleReturnQtyChange(idx, item.qty + 1)}>+</button>
                         </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {returnItems.length === 0 && (
                    <div className="pos-cart-empty">لا توجد منتجات في الفاتورة</div>
                  )}
                </div>

                <div className="pos-save-actions" style={{ borderTop: 'none' }}>
                  <button className="pos-btn-cancel" onClick={resetReturn}>
                    إلغاء
                  </button>
                  <button className="pos-btn-save" onClick={handleSubmitReturn}
                    disabled={saving || returnItems.every(i => i.qty === 0)}>
                    {saving ? 'جاري الحفظ...' : '💾 تسجيل المرتجع'}
                  </button>
                </div>
              </>
            )}

            {success && (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                <h4 style={{ marginBottom: 8 }}>تم تسجيل المرتجع بنجاح</h4>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                  مرتجع فاتورة #{success.invoiceNumber || success.id}
                </p>
                <button className="btn-custom btn-custom-accent" onClick={resetReturn}>
                  مرتجع آخر
                </button>
              </div>
            )}

            {!originalInvoice && !success && (
              <div className="pos-cart-empty" style={{ flex: 1 }}>
                ابحث عن فاتورة التوريد والتركيب لبدء المرتجع
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BranchSupplyInstallation;
