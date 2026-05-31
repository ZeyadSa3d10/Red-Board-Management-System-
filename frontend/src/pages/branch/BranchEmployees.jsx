import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatRole, getToday } from '../../utils/formatters';
import { useNotifications } from '../../context/NotificationContext';
import { BsPlus, BsTrash } from 'react-icons/bs';

const BranchEmployees = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', role: 'staff', salary: '', nationalId: '', joinDate: '' });

  const branchId = user?.branchId;
  const isManager = user?.role === 'owner';

  const load = async () => {
    setLoading(true);
    const [emps, b] = await Promise.all([api.getEmployees(), api.getBranches()]);
    setEmployees(emps.filter(e => e.branchId === branchId));
    setBranches(b);
    setLoading(false);
  };

  useEffect(() => { load(); }, [branchId]);

  const handleAdd = async () => {
    if (!form.name || !form.phone || !form.salary) {
      addNotification('يرجى ملء الحقول المطلوبة', 'danger');
      return;
    }
    await api.addEmployee({ ...form, branchId, role: form.role, salary: Number(form.salary), joinDate: form.joinDate || getToday() });
    addNotification(`تم إضافة ${form.name} بنجاح`, 'success');
    setShowForm(false);
    setForm({ name: '', phone: '', role: 'staff', salary: '', nationalId: '', joinDate: '' });
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h2>إدارة الموظفين - {branches.find(b => b.id === branchId)?.name}</h2>
        {isManager && (
          <button className="btn-custom btn-custom-accent" onClick={() => setShowForm(true)}>
            <BsPlus size={20} /> إضافة موظف
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
          <table className="table-custom">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>رقم الهاتف</th>
                <th>الدور</th>
                <th>الراتب</th>
                <th>الرقم القومي</th>
                <th>تاريخ التعيين</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                    لا يوجد موظفون في هذا الفرع
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 500 }}>{emp.name}</td>
                    <td>{emp.phone}</td>
                    <td><Badge label={formatRole(emp.role)} color={emp.role === 'accountant' ? 'info' : emp.role === 'owner' ? 'warning' : 'secondary'} /></td>
                    <td className="mono">{emp.salary ? formatCurrency(emp.salary) : '-'}</td>
                    <td>{emp.nationalId || '-'}</td>
                    <td>{emp.joinDate}</td>
                    <td><Badge label={emp.status === 'active' ? 'نشط' : 'غير نشط'} color={emp.status === 'active' ? 'success' : 'danger'} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <Modal show={showForm} onClose={() => setShowForm(false)} title="إضافة موظف جديد">
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الاسم *</label>
          <input className="form-control-custom" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>رقم الهاتف *</label>
          <input className="form-control-custom" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الدور</label>
          <select className="form-control-custom" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
            <option value="staff">موظف</option>
            <option value="accountant">محاسب</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الراتب *</label>
          <input className="form-control-custom" type="number" min="1" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الرقم القومي</label>
          <input className="form-control-custom" value={form.nationalId} onChange={e => setForm(p => ({ ...p, nationalId: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>تاريخ التعيين</label>
          <input className="form-control-custom" type="date" value={form.joinDate} onChange={e => setForm(p => ({ ...p, joinDate: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn-custom btn-custom-outline" onClick={() => setShowForm(false)}>إلغاء</button>
          <button className="btn-custom btn-custom-accent" onClick={handleAdd}>إضافة</button>
        </div>
      </Modal>
    </div>
  );
};

export default BranchEmployees;
