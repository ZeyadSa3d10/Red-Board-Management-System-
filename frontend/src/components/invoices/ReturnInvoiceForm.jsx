import { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import { BsSave } from 'react-icons/bs';

const ReturnInvoiceForm = ({ invoice, onComplete }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [items, setItems] = useState(
    invoice?.items?.map(item => ({ ...item, returnQty: 0 })) || []
  );
  const [notes, setNotes] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const returnItems = items.filter(i => i.returnQty > 0);
    if (returnItems.length === 0) {
      addNotification('يرجى تحديد كميات المرتجع', 'danger');
      return;
    }
    setSaving(true);
    await api.createInvoice({
      type: 'return_sale',
      branchId: invoice.branchId,
      relatedInvoiceId: invoice.id,
      items: returnItems.map(i => ({
        productId: i.productId,
        qty: i.returnQty,
        unitPrice: i.unitPrice,
        totalPrice: i.returnQty * i.unitPrice,
      })),
      subtotal: returnItems.reduce((s, i) => s + (i.returnQty * i.unitPrice), 0),
      discount: 0,
      totalAmount: returnItems.reduce((s, i) => s + (i.returnQty * i.unitPrice), 0),
      returnReason,
      createdBy: user?.id || 'E002',
      notes,
    });
    setSaving(false);
    addNotification('تم تسجيل المرتجع بنجاح', 'success');
    onComplete?.();
  };

  return (
    <div>
      <p style={{ marginBottom: 12 }}>اختر الكميات المرتجعة من الفاتورة #{invoice?.id}</p>
      <table className="table-custom" style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الكمية الأصلية</th>
            <th>سعر الوحدة</th>
            <th>المرتجع</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.productId}</td>
              <td>{item.qty}</td>
              <td className="mono">{item.unitPrice}</td>
              <td>
                <input className="form-control-custom" type="number" min="0" max={item.qty}
                  value={item.returnQty} onChange={e => {
                    const updated = [...items];
                    updated[idx] = { ...updated[idx], returnQty: Number(e.target.value) };
                    setItems(updated);
                  }} style={{ width: 100 }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>سبب المرتجع</label>
        <input className="form-control-custom" value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="اختياري" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>ملاحظات</label>
        <input className="form-control-custom" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <button className="btn-custom btn-custom-primary" onClick={handleSave} disabled={saving}>
        <BsSave size={16} /> {saving ? 'جاري...' : 'تأكيد المرتجع'}
      </button>
    </div>
  );
};

export default ReturnInvoiceForm;
