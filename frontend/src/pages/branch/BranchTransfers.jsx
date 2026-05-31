import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { useNotifications } from '../../context/NotificationContext';
import { BsPlus, BsArrowRight, BsArrowLeft } from 'react-icons/bs';

const BranchTransfers = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [form, setForm] = useState({ sourceBranchId: '', destinationBranchId: user?.branchId || '', notes: '', items: [{ productId: '', qty: '' }] });

  const load = async () => {
    setLoading(true);
    const [t, p, b] = await Promise.all([
      api.getTransfers().catch(() => []),
      api.getProducts().catch(() => []),
      api.getBranches().catch(() => []),
    ]);
    const filteredTransfers = user?.branchId 
      ? t.filter(x => x.sourceBranchId === user.branchId || x.destinationBranchId === user.branchId)
      : t;
    setTransfers(filteredTransfers);
    setProducts(p);
    setBranches(b);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { productId: '', qty: '' }] }));
  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, value) => setForm(p => {
    const items = [...p.items];
    items[idx] = { ...items[idx], [field]: value };
    return { ...p, items };
  });

  const handleCreate = async () => {
    if (!form.sourceBranchId || !form.destinationBranchId || form.sourceBranchId === form.destinationBranchId) {
      addNotification( form.sourceBranchId === form.destinationBranchId ? 'يجب اختيار فرعين مختلفين' : 'يرجى اختيار الفروع', 'danger');
      return;
    }
    if (!form.items.length || !form.items[0].productId) {
      addNotification('يرجى إضافة صنف واحد على الأقل', 'danger');
      return;
    }
    await api.createTransfer(form);
    addNotification('تم إنشاء أمر التحويل', 'success');
    setShowForm(false);
    setForm({ sourceBranchId: '', destinationBranchId: user?.branchId || '', notes: '', items: [{ productId: '', qty: '' }] });
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h2>تحويل بضاعة</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowForm(true)}>
          <BsPlus size={20} /> تحويل جديد
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'transferNumber', header: 'رقم التحويل', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
          { key: 'sourceBranchName', header: 'من فرع' },
          { key: 'destinationBranchName', header: 'إلى فرع' },
          { key: 'status', header: 'الحالة', render: (v) => <Badge label={v === 'Completed' ? 'مكتمل' : v === 'Pending' ? 'معلق' : v === 'Rejected' ? 'مرفوض' : v} color={v === 'Completed' ? 'success' : v === 'Pending' ? 'warning' : 'danger'} /> },
          { key: 'createdAt', header: 'التاريخ', render: (v) => v?.slice(0, 10) || '-' },
          { key: 'createdBy', header: 'بواسطة' },
          { 
            key: 'actions', 
            header: 'تفاصيل', 
            render: (_, row) => (
              <button 
                className="btn-custom btn-custom-outline btn-sm" 
                onClick={() => setSelectedTransfer(row)}
              >
                عرض الأصناف
              </button>
            ) 
          },
        ]}
        data={transfers}
        loading={loading}
        searchable
      />

      <Modal show={showForm} onClose={() => setShowForm(false)} title="تحويل بضاعة جديد">
        <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>من فرع</label>
            <select className="form-control-custom" value={form.sourceBranchId} onChange={e => setForm(p => ({ ...p, sourceBranchId: e.target.value }))}>
              <option value="">اختر الفرع</option>
              {branches.filter(b => !b.isAdminBranch).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>إلى فرع (فرعي)</label>
            <select 
              className="form-control-custom" 
              value={form.destinationBranchId} 
              onChange={e => setForm(p => ({ ...p, destinationBranchId: e.target.value }))}
              disabled={!!user?.branchId}
            >
              <option value="">اختر الفرع</option>
              {branches.filter(b => !b.isAdminBranch).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 13 }}>الأصناف</div>
        {form.items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <select className="form-control-custom" style={{ flex: 1 }} value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}>
              <option value="">اختر المنتج</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="form-control-custom" style={{ width: 80 }} type="number" min="1" placeholder="الكمية" value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} />
            {form.items.length > 1 && <button className="btn-custom btn-custom-outline" style={{ color: 'var(--color-danger)', padding: '4px 8px' }} onClick={() => removeItem(idx)}>x</button>}
          </div>
        ))}
        <button className="btn-custom btn-custom-outline btn-sm" onClick={addItem} style={{ marginBottom: 12 }}>+ إضافة صنف</button>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>ملاحظات</label>
          <textarea className="form-control-custom" rows="2" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-custom btn-custom-outline" onClick={() => setShowForm(false)}>إلغاء</button>
          <button className="btn-custom btn-custom-primary" onClick={handleCreate}>
            <BsArrowLeft size={16} /> تأكيد التحويل
          </button>
        </div>
      </Modal>

      {selectedTransfer && (
        <Modal show={true} onClose={() => setSelectedTransfer(null)} title={`تفاصيل التحويل (${selectedTransfer.transferNumber})`}>
          <div style={{ marginBottom: 16 }}>
            <div className="grid-2-sm" style={{ gap: 10, marginBottom: 15, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
              <div><strong style={{ color: 'var(--color-text-muted)' }}>من فرع:</strong> {selectedTransfer.sourceBranchName}</div>
              <div><strong style={{ color: 'var(--color-text-muted)' }}>إلى فرع:</strong> {selectedTransfer.destinationBranchName}</div>
              <div><strong style={{ color: 'var(--color-text-muted)' }}>التاريخ:</strong> {selectedTransfer.createdAt?.slice(0, 10)}</div>
              <div><strong style={{ color: 'var(--color-text-muted)' }}>بواسطة:</strong> {selectedTransfer.createdBy}</div>
              <div style={{ gridColumn: 'span 2' }}><strong style={{ color: 'var(--color-text-muted)' }}>ملاحظات:</strong> {selectedTransfer.notes || '-'}</div>
            </div>
            
            <h6 style={{ fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 10 }}>الأصناف المحولة</h6>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>الصنف</th>
                    <th>الكمية</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransfer.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.productName}</td>
                      <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                    </tr>
                  ))}
                  {!selectedTransfer.items?.length && (
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'center', padding: 20 }}>لا توجد أصناف</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-custom" onClick={() => setSelectedTransfer(null)}>إغلاق</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BranchTransfers;
