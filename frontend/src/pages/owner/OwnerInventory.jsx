import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import StockTable from '../../components/inventory/StockTable';
import Modal from '../../components/common/Modal';
import { useNotifications } from '../../context/NotificationContext';
import { BsPlus } from 'react-icons/bs';

const OwnerInventory = () => {
  const { addNotification } = useNotifications();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    name: '', barcode: '', unit: 'قطعة', 
    purchasePrice: '', minSalePrice: '', 
    currentSalePrice: '', minStockAlert: '10', 
    categoryId: '',
    initialQuantities: {} // { branchId: qty }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [data, cats, brs] = await Promise.all([
        api.getAllStock(), 
        api.getCategories(),
        api.getBranches()
      ]);
      setProducts(data);
      setCategories(cats);
      setBranches(brs);
    } catch (err) {
      addNotification('حدث خطأ أثناء تحميل البيانات', 'danger');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.unit || !form.minSalePrice || !form.currentSalePrice || !form.categoryId) {
      addNotification('يرجى ملء جميع الحقول المطلوبة (الاسم، الوحدة، الأسعار، التصنيف)', 'danger');
      return;
    }

    const payload = {
      ...form,
      initialQuantities: Object.entries(form.initialQuantities)
        .map(([branchId, data]) => ({ 
          branchId: Number(branchId), 
          quantity: Number(data.qty) || 0,
          averageCost: Number(data.cost) || 0
        }))
        .filter(iq => iq.quantity > 0 || iq.averageCost > 0)
    };

    try {
      if (isEditing) {
        await api.updateProduct(editId, payload);
        addNotification('تم تحديث المنتج بنجاح', 'success');
      } else {
        await api.addProduct(payload);
        addNotification('تم إضافة المنتج بنجاح', 'success');
      }
      setShowForm(false);
      setForm({ 
        name: '', barcode: '', unit: 'قطعة', 
        purchasePrice: '', minSalePrice: '', 
        currentSalePrice: '', minStockAlert: '10', 
        categoryId: '',
        initialQuantities: {}
      });
      setIsEditing(false);
      setEditId(null);
      load();
    } catch (err) {
      addNotification(isEditing ? 'فشل تحديث المنتج' : 'فشل إضافة المنتج', 'danger');
    }
  };

  const handleEdit = (p) => {
    const qtys = {};
    if (p.branchStocks) {
      p.branchStocks.forEach(bs => {
        qtys[bs.branchId] = { qty: bs.quantity, cost: bs.averageCost };
      });
    }

    setForm({
      name: p.name,
      barcode: p.barcode || '',
      unit: p.unit,
      purchasePrice: p.purchasePrice ?? '',
      minSalePrice: p.minSalePrice,
      currentSalePrice: p.currentSalePrice,
      minStockAlert: p.minStockAlert,
      categoryId: p.categoryId,
      initialQuantities: qtys
    });
    setIsEditing(true);
    setEditId(p.id);
    setShowForm(true);
  };

  const handleBranchChange = (branchId, field, value) => {
    setForm(p => ({
      ...p,
      initialQuantities: {
        ...p.initialQuantities,
        [branchId]: {
          ...(p.initialQuantities[branchId] || { qty: '', cost: '' }),
          [field]: value
        }
      }
    }));
  };

  return (
    <div>
      <div className="page-header">
        <h2>المخزون الكامل</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowForm(true)}>
          <BsPlus size={20} /> إضافة منتج
        </button>
      </div>
      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : (
        <>
          <StockTable products={products} branches={branches} onRefresh={load} onEdit={handleEdit} />
        </>
      )}

      <Modal show={showForm} onClose={() => {
        setShowForm(false);
        setIsEditing(false);
        setEditId(null);
        setForm({ 
          name: '', barcode: '', unit: 'قطعة', 
          purchasePrice: '', minSalePrice: '', 
          currentSalePrice: '', minStockAlert: '10', 
          categoryId: '',
          initialQuantities: {}
        });
      }} title={isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}>
        <div className="grid-2-sm" style={{ gap: 16 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>اسم المنتج *</label>
            <input className="form-control-custom" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>باركود</label>
            <input className="form-control-custom" value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>التصنيف *</label>
            <select className="form-control-custom" value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
              <option value="">اختر التصنيف</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الوحدة *</label>
            <select className="form-control-custom" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
              <option value="قطعة">قطعة</option>
              <option value="كيلو">كيلو</option>
              <option value="متر">متر</option>
              <option value="لتر">لتر</option>
              <option value="كرتونة">كرتونة</option>
              <option value="شيكارة">شيكارة</option>
              <option value="طقم">طقم</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الحد الأدنى للمخزون</label>
            <input className="form-control-custom" type="number" min="0" value={form.minStockAlert} onChange={e => setForm(p => ({ ...p, minStockAlert: e.target.value }))} />
          </div>
          
          <div style={{ gridColumn: 'span 2', height: 1, backgroundColor: '#eee', margin: '10px 0' }}></div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>سعر البيع الحالي *</label>
            <input className="form-control-custom" type="number" min="0" value={form.currentSalePrice} onChange={e => setForm(p => ({ ...p, currentSalePrice: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>أقل سعر بيع *</label>
            <input className="form-control-custom" type="number" min="0" value={form.minSalePrice} onChange={e => setForm(p => ({ ...p, minSalePrice: e.target.value }))} />
          </div>

          <div style={{ gridColumn: 'span 2', marginTop: 10 }}>
            <label style={{ display: 'block', marginBottom: 10, fontWeight: 600, borderBottom: '1px solid #ddd', paddingBottom: 5 }}>كميات وتكاليف الفروع</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {branches.map(br => (
                <div key={br.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', alignItems: 'center', gap: 10, background: '#f8f9fa', padding: '8px 12px', borderRadius: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 500 }}>{br.name}</label>
                  <input 
                    className="form-control-custom" 
                    type="number" 
                    min="0" 
                    placeholder="الكمية"
                    value={form.initialQuantities[br.id]?.qty || ''} 
                    onChange={e => handleBranchChange(br.id, 'qty', e.target.value)} 
                  />
                  <input 
                    className="form-control-custom" 
                    type="number" 
                    min="0" 
                    placeholder="تكلفة الوحدة"
                    value={form.initialQuantities[br.id]?.cost || ''} 
                    onChange={e => handleBranchChange(br.id, 'cost', e.target.value)} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 25, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-custom" onClick={() => {
            setShowForm(false);
            setIsEditing(false);
            setEditId(null);
          }}>إلغاء</button>
          <button className="btn-custom btn-custom-accent" onClick={handleAdd}>
            {isEditing ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
  

export default OwnerInventory;
