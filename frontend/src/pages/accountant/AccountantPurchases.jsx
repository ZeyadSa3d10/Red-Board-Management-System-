import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/formatters';
import { BsSave, BsPlus, BsTrash } from 'react-icons/bs';

const AccountantPurchases = () => {
  const { addNotification } = useNotifications();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);

  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [transportCost, setTransportCost] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', qty: 1, unitCost: 0 }]);

  useEffect(() => {
    Promise.all([api.getSuppliers(), api.getProducts(), api.getBranches()]).then(([s, p, b]) => {
      setSuppliers(s);
      setProducts(p);
      setBranches(b.filter(br => !br.isAdmin));
    });
  }, []);

  const addItem = () => setItems(prev => [...prev, { productId: '', qty: 1, unitCost: 0 }]);
  const removeItem = (idx) => { if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx)); };

  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) updated[idx].unitCost = product.purchasePrice || 0;
      }
      return updated;
    });
  };

  const totalAmount = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (item.qty * (item.unitCost || 0));
  }, 0) + Number(transportCost);

  const handleSave = async () => {
    if (!supplierId || !branchId) {
      addNotification('يرجى اختيار المورد والفرع', 'danger');
      return;
    }
    if (items.some(i => !i.productId || !i.qty)) {
      addNotification('يرجى إكمال بيانات البنود', 'danger');
      return;
    }
    setSaving(true);
    const transport = Number(transportCost) || 0;
    const itemsTotal = items.reduce((sum, i) => sum + (i.qty * (i.unitCost || 0)), 0);
    const grandTotal = itemsTotal + transport;
    await api.addPurchaseInvoice({
      supplierId,
      branchId,
      items: items.map(i => ({ productId: i.productId, qty: i.qty, unitCost: i.unitCost, totalCost: i.qty * i.unitCost })),
      totalAmount: itemsTotal,
      transportCost: transport,
      paidAmount: Number(paidAmount) || 0,
      paymentMethod,
      projectName: projectName || null,
      remainingAmount: grandTotal - (Number(paidAmount) || 0),
      addedBy: 'E011',
      status: Number(paidAmount) >= grandTotal ? 'paid' : Number(paidAmount) > 0 ? 'partial' : 'unpaid',
      notes,
    });
    addNotification('تمت إضافة فاتورة الشراء والمخزون محدث', 'success');
    setSaving(false);
    setItems([{ productId: '', qty: 1, unitCost: 0 }]);
    setPaidAmount(0);
    setNotes('');
  };

  return (
    <div>
      <div className="page-header">
        <h2>إضافة مشتريات للمخزون</h2>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div className="grid-2-sm" style={{ gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>المورد *</label>
            <select className="form-control-custom" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">اختر المورد</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الفرع المستلم *</label>
            <select className="form-control-custom" value={branchId} onChange={e => setBranchId(e.target.value)}>
              <option value="">اختر الفرع</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h5 style={{ margin: 0, fontWeight: 600 }}>المنتجات</h5>
            <button className="btn-custom btn-custom-accent btn-custom-sm" onClick={addItem}>
              <BsPlus size={18} /> إضافة منتج
            </button>
          </div>
          <table className="table-custom">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>سعر الشراء</th>
                <th>الإجمالي</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <select className="form-control-custom" value={item.productId} onChange={e => handleItemChange(idx, 'productId', e.target.value)}>
                      <option value="">اختر منتج</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td><input className="form-control-custom" type="number" min="1" value={item.qty}
                    onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))} style={{ width: 100 }} /></td>
                  <td><input className="form-control-custom" type="number" min="0" value={item.unitCost}
                    onChange={e => handleItemChange(idx, 'unitCost', Number(e.target.value))} style={{ width: 120 }} /></td>
                  <td className="mono">{formatCurrency(item.qty * item.unitCost)}</td>
                  <td>
                    <button className="btn-custom btn-custom-danger btn-custom-sm" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                      <BsTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'left', fontSize: '1.1rem', fontWeight: 700, marginTop: 12 }}>
            الإجمالي: <span className="mono" style={{ color: 'var(--color-accent)' }}>{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="grid-2-sm" style={{ gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>سعر النقل</label>
            <input className="form-control-custom" type="number" min="0" value={transportCost}
              onChange={e => setTransportCost(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>اسم المشروع (اختياري)</label>
            <input className="form-control-custom" type="text" value={projectName}
              onChange={e => setProjectName(e.target.value)} placeholder="اسم المشروع إن وجد" />
          </div>
        </div>

        <div className="grid-2-sm" style={{ gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>المدفوع الآن</label>
            <input className="form-control-custom" type="number" min="0" value={paidAmount}
              onChange={e => setPaidAmount(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>طريقة الدفع</label>
            <select className="form-control-custom" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="cash">نقدي</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="check">شيك</option>
              <option value="vodafone_cash">فودافون كاش</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>ملاحظات</label>
          <textarea className="form-control-custom" rows="2" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <button className="btn-custom btn-custom-primary" onClick={handleSave} disabled={saving}>
          <BsSave size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ الفاتورة وتحديث المخزون'}
        </button>
      </div>
    </div>
  );
};

export default AccountantPurchases;
