import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import { formatCurrency } from '../../utils/formatters';
import { useNotifications } from '../../context/NotificationContext';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import { BsPlus } from 'react-icons/bs';

const OwnerProducts = () => {
  const { addNotification } = useNotifications();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', barcode: '', unit: 'قطعة', purchasePrice: '', minSalePrice: '', currentSalePrice: '', minStockAlert: '10', categoryId: '' });

  const load = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([api.getProducts(), api.getCategories()]);
    setProducts(p || []);
    setCategories(c || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.unit || !form.purchasePrice || !form.minSalePrice || !form.currentSalePrice || !form.categoryId) {
      addNotification('يرجى ملء جميع الحقول المطلوبة', 'danger');
      return;
    }
    await api.addProduct(form);
    addNotification('تم إضافة المنتج', 'success');
    setShowForm(false);
    setForm({ name: '', barcode: '', unit: 'قطعة', purchasePrice: '', minSalePrice: '', currentSalePrice: '', minStockAlert: '10', categoryId: '' });
    load();
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h2>إدارة المنتجات</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowForm(true)}>
          <BsPlus size={20} /> إضافة منتج
        </button>
      </div>
      <FilterBar variant="simple" onReset={resetFilters} activeCount={activeCount}>
        <FilterSearch value={filters.search} onChange={v => setFilter('search', v)} />
      </FilterBar>

      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>باركود</th>
                <th>التصنيف</th>
                <th>الوحدة</th>
                <th>سعر الشراء</th>
                <th>أقل سعر بيع</th>
                <th>سعر البيع</th>
                <th>الحد الأدنى</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.barcode || '—'}</td>
                  <td>{p.categoryName || '—'}</td>
                  <td>{p.unit}</td>
                  <td className="mono">{formatCurrency(p.purchasePrice)}</td>
                  <td className="mono">{formatCurrency(p.minSalePrice)}</td>
                  <td className="mono">{formatCurrency(p.currentSalePrice)}</td>
                  <td>{p.minStockAlert}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Modal show={showForm} onClose={() => setShowForm(false)} title="إضافة منتج جديد">
        <div className="grid-2-sm" style={{ gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>اسم المنتج *</label>
            <input className="form-control-custom" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>باركود</label>
            <input className="form-control-custom" value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))} />
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
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>التصنيف *</label>
            <select className="form-control-custom" value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
              <option value="">اختر التصنيف</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>سعر الشراء *</label>
            <input className="form-control-custom" type="number" min="0" value={form.purchasePrice} onChange={e => setForm(p => ({ ...p, purchasePrice: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>أقل سعر بيع *</label>
            <input className="form-control-custom" type="number" min="0" value={form.minSalePrice} onChange={e => setForm(p => ({ ...p, minSalePrice: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>سعر البيع الحالي *</label>
            <input className="form-control-custom" type="number" min="0" value={form.currentSalePrice} onChange={e => setForm(p => ({ ...p, currentSalePrice: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الحد الأدنى للمخزون</label>
            <input className="form-control-custom" type="number" min="0" value={form.minStockAlert} onChange={e => setForm(p => ({ ...p, minStockAlert: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-custom btn-custom-primary" onClick={handleAdd}>إضافة</button>
        </div>
      </Modal>
    </div>
  );
};

export default OwnerProducts;
