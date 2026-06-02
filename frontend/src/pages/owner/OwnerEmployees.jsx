import { useState, useEffect, useCallback } from 'react';
import api from '../../api/realApi';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import FilterBar from '../../components/common/FilterBar';
import FilterSearch from '../../components/common/FilterSearch';
import useFilters from '../../hooks/useFilters';
import Badge from '../../components/common/Badge';
import { formatCurrency, formatDate, formatRole } from '../../utils/formatters';
import { useNotifications } from '../../context/NotificationContext';
import { BsPlus, BsCashCoin, BsKey, BsToggleOn, BsToggleOff, BsTrash } from 'react-icons/bs';

const OwnerEmployees = () => {
  const { addNotification } = useNotifications();
  const [employees, setEmployees] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resetPwd, setResetPwd] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'staff', branchId: '', salary: '', nationalId: '', joinDate: '' });

  const { filters, setFilter, resetFilters, activeCount } = useFilters({ search: '' }, { debounceMs: 300 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getEmployeesFiltered({ search: filters.search, page, pageSize: 15 });
      const items = result?.items || result || [];
      setEmployees(items);
      setTotalCount(result?.totalCount || items.length);
    } catch { setEmployees([]); setTotalCount(0); }
    setLoading(false);
  }, [filters.search, page]);

  useEffect(() => { load(); }, [filters.search, page]);

  useEffect(() => {
    Promise.all([
      api.getSalaryPayments().catch(() => []),
      api.getBranches().catch(() => []),
    ]).then(([sp, b]) => { setSalaryPayments(sp); setBranches(b); });
  }, []);

  const isSalaryPaid = (employeeId, month) => {
    return salaryPayments.some(sp => sp.employeeId === employeeId && sp.month === month && sp.status === 'paid');
  };

  const handleAddEmployee = async () => {
    if (!form.name || !form.phone || !form.password) {
      addNotification('يرجى ملء الاسم والهاتف وكلمة المرور', 'danger');
      return;
    }
    await api.addEmployee(form);
    addNotification('تم إضافة الموظف', 'success');
    setShowForm(false);
    setForm({ name: '', phone: '', password: '', role: 'staff', branchId: '', salary: '', nationalId: '', joinDate: '' });
    load();
  };

  const handlePaySalary = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      addNotification('يرجى إدخال مبلغ صحيح', 'danger');
      return;
    }
    const month = new Date().toISOString().slice(0, 7);
    await api.paySalary(selectedEmp.id, month, Number(payAmount));
    addNotification(`تم دفع راتب ${selectedEmp.name}`, 'success');
    setShowPay(false);
    load();
  };

  const handleResetPassword = async () => {
    if (!resetPwd || resetPwd.length < 4) {
      addNotification('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'danger');
      return;
    }
    await api.resetEmployeePassword(selectedEmp.id, resetPwd);
    addNotification(`تم تغيير كلمة مرور ${selectedEmp.name}`, 'success');
    setShowResetPwd(false);
    setResetPwd('');
  };

  const columns = [
    { key: 'fullName', header: 'الاسم', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'role', header: 'الدور', render: (v, row) => {
      const roleLower = v?.toLowerCase?.();
      return <Badge label={formatRole(roleLower)} color={roleLower === 'owner' ? 'warning' : roleLower === 'accountant' ? 'info' : 'secondary'} />;
    }},
    { key: 'branchName', header: 'الفرع' },
    { key: 'salary', header: 'الراتب', render: (v) => v ? <span className="mono">{formatCurrency(v)}</span> : '-' },
    { key: 'phone', header: 'الهاتف' },
    { key: 'isActive', header: 'الحالة', render: (v) => <Badge label={v ? 'نشط' : 'غير نشط'} color={v ? 'success' : 'danger'} /> },
    {
      key: 'actions', header: '', width: 200, sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-custom btn-custom-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            onClick={(e) => { e.stopPropagation(); setSelectedEmp(row); setResetPwd(''); setShowResetPwd(true); }}>
            <BsKey size={12} /> كلمة السر
          </button>
          {row.role?.toLowerCase() !== 'owner' && (
            <button className="btn-custom btn-custom-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: row.isActive ? 'var(--color-warning)' : 'var(--color-success)' }}
              onClick={async (e) => { e.stopPropagation(); await api.toggleEmployeeActive(row.id); load(); }}>
              {row.isActive ? <><BsToggleOff size={12} /> تعطيل</> : <><BsToggleOn size={12} /> تفعيل</>}
            </button>
          )}
          <button className="btn-custom btn-custom-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-danger)' }}
            onClick={(e) => { e.stopPropagation(); setSelectedEmp(row); setShowDeleteConfirm(true); }}>
            <BsTrash size={12} /> حذف
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>الموظفون والرواتب</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowForm(true)}>
          <BsPlus size={20} /> إضافة موظف
        </button>
      </div>

      <FilterBar variant="simple" onReset={() => { resetFilters(); setPage(1); }} activeCount={activeCount} loading={loading}>
        <FilterSearch value={filters.search} onChange={v => { setFilter('search', v); setPage(1); }} placeholder="بحث باسم الموظف..." />
      </FilterBar>

      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        serverSide
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        pageSize={15}
        onRowClick={(emp) => {
          if (emp.salary) {
            setSelectedEmp(emp);
            const currentMonth = new Date().toISOString().slice(0, 7);
            setPayAmount(emp.salary.toString());
            if (!isSalaryPaid(emp.id, currentMonth)) {
              setShowPay(true);
            }
          }
        }}
      />

      {selectedEmp && (
        <Modal show={showPay} onClose={() => setShowPay(false)} title={`صرف راتب ${selectedEmp.name}`}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>شهر</label>
            <input className="form-control-custom" value={new Date().toISOString().slice(0, 7)} disabled />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الراتب</label>
            <input className="form-control-custom" type="number" min="1" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn-custom btn-custom-outline" onClick={() => setShowPay(false)}>إلغاء</button>
            <button className="btn-custom btn-custom-accent" onClick={handlePaySalary}>
              <BsCashCoin size={16} /> تأكيد الصرف
            </button>
          </div>
        </Modal>
      )}

      {selectedEmp && (
        <Modal show={showResetPwd} onClose={() => setShowResetPwd(false)} title={`تغيير كلمة المرور - ${selectedEmp.name}`}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>كلمة المرور الجديدة</label>
            <input className="form-control-custom" type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)} placeholder="أدخل كلمة المرور الجديدة" />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn-custom btn-custom-outline" onClick={() => setShowResetPwd(false)}>إلغاء</button>
            <button className="btn-custom btn-custom-primary" onClick={handleResetPassword}>
              <BsKey size={16} /> حفظ
            </button>
          </div>
        </Modal>
      )}

      {selectedEmp && (
        <Modal show={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="تأكيد الحذف">
          <p>هل أنت متأكد من حذف الموظف <strong>{selectedEmp.fullName}</strong>؟</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>هذا الإجراء لا يمكن التراجع عنه.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn-custom btn-custom-outline" onClick={() => setShowDeleteConfirm(false)}>إلغاء</button>
            <button className="btn-custom" style={{ background: 'var(--color-danger)', color: '#fff', border: 'none' }}
              onClick={async () => { await api.deleteEmployee(selectedEmp.id); setShowDeleteConfirm(false); load(); }}>تأكيد الحذف</button>
          </div>
        </Modal>
      )}

      <Modal show={showForm} onClose={() => setShowForm(false)} title="إضافة موظف جديد">
        <div className="grid-2-sm" style={{ gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الاسم *</label>
            <input className="form-control-custom" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>رقم الهاتف *</label>
            <input className="form-control-custom" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>كلمة المرور *</label>
            <input className="form-control-custom" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="6 أحرف على الأقل" />
            <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>يجب أن تكون 6 أحرف على الأقل</small>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الدور</label>
            <select className="form-control-custom" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="staff">موظف</option>
              <option value="accountant">محاسب</option>
              <option value="owner">المدير</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الفرع</label>
            <select className="form-control-custom" value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}>
              <option value="">اختر الفرع</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الراتب</label>
            <input className="form-control-custom" type="number" min="1" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الرقم القومي</label>
            <input className="form-control-custom" value={form.nationalId} onChange={e => setForm(p => ({ ...p, nationalId: e.target.value }))} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>تاريخ التعيين</label>
            <input className="form-control-custom" type="date" value={form.joinDate} onChange={e => setForm(p => ({ ...p, joinDate: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-custom btn-custom-primary" onClick={handleAddEmployee}>إضافة</button>
        </div>
      </Modal>
    </div>
  );
};

export default OwnerEmployees;
