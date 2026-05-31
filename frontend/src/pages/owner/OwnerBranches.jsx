import { useState, useEffect, useMemo } from 'react';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import { useNotifications } from '../../context/NotificationContext';
import { BsPlus, BsBuilding } from 'react-icons/bs';

const OwnerBranches = () => {
  const { addNotification } = useNotifications();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', phone: '', isAdminBranch: false });
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return branches;
    const q = search.toLowerCase();
    return branches.filter(b =>
      b.name?.toLowerCase().includes(q) ||
      b.location?.toLowerCase().includes(q) ||
      b.phone?.includes(q)
    );
  }, [branches, search]);

  const load = async () => {
    setLoading(true);
    const data = await api.getBranches();
    setBranches(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.name) {
      addNotification('يرجى إدخال اسم الفرع', 'danger');
      return;
    }
    await api.addBranch(form);
    addNotification('تم إضافة الفرع', 'success');
    setShowForm(false);
    setForm({ name: '', location: '', phone: '', isAdminBranch: false });
    load();
  };

  if (loading) return <div className="loading-container"><div className="spinner-border" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2>الفروع</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowForm(true)}>
          <BsPlus size={20} /> إضافة فرع
        </button>
      </div>

      <FilterBar variant="simple">
        <FilterSearch value={search} onChange={setSearch} placeholder="بحث باسم الفرع أو الموقع..." />
      </FilterBar>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(b => (
          <div key={b.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BsBuilding size={22} color="var(--color-primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{b.name}</div>
                <Badge label={b.isAdminBranch ? 'إداري' : 'فرع بيع'} color={b.isAdminBranch ? 'info' : 'success'} />
              </div>
              <Badge label={b.isActive ? 'نشط' : 'غير نشط'} color={b.isActive ? 'success' : 'danger'} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              <i className="fas fa-map-marker-alt" style={{ marginLeft: 6 }} />{b.location}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <i className="fas fa-phone" style={{ marginLeft: 6 }} />{b.phone}
            </div>
          </div>
        ))}
      </div>

      <Modal show={showForm} onClose={() => setShowForm(false)} title="إضافة فرع جديد">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>اسم الفرع *</label>
            <input className="form-control-custom" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الموقع</label>
            <input className="form-control-custom" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>رقم الهاتف</label>
            <input className="form-control-custom" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.isAdminBranch} onChange={e => setForm(p => ({ ...p, isAdminBranch: e.target.checked }))} />
              فرع إداري
            </label>
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-custom btn-custom-primary" onClick={handleAdd}>إضافة</button>
        </div>
      </Modal>
    </div>
  );
};

export default OwnerBranches;
