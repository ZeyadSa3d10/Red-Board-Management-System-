import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../api/realApi';
import useFilters from '../../hooks/useFilters';
import FilterBar from '../../components/common/FilterBar';
import FilterGroup from '../../components/common/FilterGroup';
import { formatCurrency, formatDate, getToday } from '../../utils/formatters';
import { BsPlus, BsTrash, BsSave } from 'react-icons/bs';

const BranchExpenses = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultBranch = user?.role !== 'owner' ? user?.branchId || '' : '';
  const { filters, setFilter, resetFilters, activeCount } = useFilters({ branchId: defaultBranch, dateFrom: '', dateTo: '' });

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [expenseDate, setExpenseDate] = useState(getToday());
  const [formBranch, setFormBranch] = useState(user?.branchId || '');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [filterInputs, setFilterInputs] = useState({ dateFrom: '', dateTo: '' });
  const [quickFilter, setQuickFilter] = useState('');

  const load = async (appliedFilters = {}) => {
    setLoading(true);
    const params = {};
    const activeBranch = user?.role !== 'owner' ? (user?.branchId || '') : (appliedFilters.branchId || '');
    if (activeBranch) params.branchId = activeBranch;
    if (appliedFilters.dateFrom) params.dateFrom = appliedFilters.dateFrom;
    if (appliedFilters.dateTo) params.dateTo = appliedFilters.dateTo;
    const [data, br] = await Promise.all([api.getExpenses(params), api.getBranches()]);
    setExpenses(Array.isArray(data) ? data : (data?.items || []));
    setBranches(br || []);
    setLoading(false);
  };

  const handleApplyFilter = () => {
    load({ dateFrom: filterInputs.dateFrom, dateTo: filterInputs.dateTo, branchId: filters.branchId });
  };

  const handleQuickFilter = (type) => {
    setQuickFilter(type);
    const today = new Date();
    const fmt = d => d.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
    let dateFrom = '', dateTo = '';
    if (type === 'today') {
      dateFrom = dateTo = fmt(today);
    } else if (type === 'month') {
      dateFrom = fmt(new Date(today.getFullYear(), today.getMonth(), 1));
      dateTo = fmt(today);
    } else if (type === 'year') {
      dateFrom = fmt(new Date(today.getFullYear(), 0, 1));
      dateTo = fmt(today);
    }
    setFilterInputs({ dateFrom, dateTo });
    if (type !== 'custom') {
      load({ dateFrom, dateTo, branchId: filters.branchId });
    }
  };

  const handleReset = () => {
    resetFilters();
    setQuickFilter('');
    setFilterInputs({ dateFrom: '', dateTo: '' });
    load();
  };

  useEffect(() => {
    const today = getToday();
    setQuickFilter('today');
    setFilterInputs({ dateFrom: today, dateTo: today });
    load({ dateFrom: today, dateTo: today });
  }, [user?.branchId]);

  const handleSave = async () => {
    if (!description || !amount || !formBranch) {
      addNotification('يرجى إكمال البيانات المطلوبة', 'danger');
      return;
    }
    setSaving(true);
    await api.addExpense({ branchId: formBranch, description, amount, expenseDate, notes: formNotes });
    addNotification('تم تسجيل المصروف بنجاح', 'success');
    setSaving(false);
    setDescription('');
    setAmount(0);
    setFormNotes('');
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteExpense(id);
      addNotification('تم حذف المصروف', 'success');
      load();
    } catch {
      addNotification('فشل حذف المصروف', 'danger');
    }
  };

  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2>مصاريف ونثريات الفروع</h2>
        <button className="btn-custom btn-custom-accent" onClick={() => setShowForm(!showForm)}>
          <BsPlus size={18} /> {showForm ? 'إلغاء' : 'إضافة مصروف'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h5 style={{ marginBottom: 16 }}>تسجيل مصروف جديد</h5>
          <div className="grid-2-sm" style={{ gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>البيان *</label>
              <input className="form-control-custom" type="text" value={description}
                onChange={e => setDescription(e.target.value)} placeholder="وصف المصروف" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>المبلغ *</label>
              <input className="form-control-custom" type="number" min="0" value={amount}
                onChange={e => setAmount(Number(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>التاريخ</label>
              <input className="form-control-custom" type="date" value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>الفرع *</label>
              {user?.role === 'owner' ? (
                <select className="form-control-custom" value={formBranch}
                  onChange={e => setFormBranch(e.target.value)}>
                  <option value="">اختر الفرع</option>
                  {branches.filter(b => !b.isAdmin).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <div style={{ padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)' }}>
                  {branches.find(b => b.id === user?.branchId)?.name || 'الفرع الحالي'}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>ملاحظات</label>
            <textarea className="form-control-custom" rows="2" value={formNotes}
              onChange={e => setFormNotes(e.target.value)} />
          </div>
          <button className="btn-custom btn-custom-primary" onClick={handleSave} disabled={saving}>
            <BsSave size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      )}

      <FilterBar variant="panel" onReset={handleReset} activeCount={activeCount || !!quickFilter}>
        {user?.role === 'owner' && (
          <FilterGroup label="الفرع">
            <select className="form-control-custom" value={filters.branchId}
              onChange={e => setFilter('branchId', e.target.value)}>
              <option value="">كل الفروع</option>
              {branches.filter(b => !b.isAdmin).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FilterGroup>
        )}
        <FilterGroup label="فترة">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { key: 'today', label: 'اليوم' },
              { key: 'month', label: 'هذا الشهر' },
              { key: 'year', label: 'هذا العام' },
              { key: 'custom', label: 'مخصص' },
            ].map(btn => (
              <button key={btn.key}
                className={`btn-custom btn-custom-sm ${quickFilter === btn.key ? 'btn-custom-primary' : 'btn-custom-outline'}`}
                onClick={() => handleQuickFilter(btn.key)}>
                {btn.label}
              </button>
            ))}
          </div>
        </FilterGroup>
        {quickFilter === 'custom' && (
          <>
            <FilterGroup label="من تاريخ">
              <input className="form-control-custom" type="date" value={filterInputs.dateFrom}
                onChange={e => setFilterInputs(prev => ({ ...prev, dateFrom: e.target.value }))} />
            </FilterGroup>
            <FilterGroup label="إلى تاريخ">
              <input className="form-control-custom" type="date" value={filterInputs.dateTo}
                onChange={e => setFilterInputs(prev => ({ ...prev, dateTo: e.target.value }))} />
            </FilterGroup>
            <button className="btn-custom btn-custom-primary" onClick={handleApplyFilter} style={{ alignSelf: 'flex-end' }}>
              تطبيق
            </button>
          </>
        )}
      </FilterBar>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: '16px 24px', flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>إجمالي المصروفات</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-danger)' }}>
            {formatCurrency(totalAmount)}
          </div>
        </div>
        <div className="card" style={{ padding: '16px 24px', flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>عدد المعاملات</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{expenses.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-custom" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>البيان</th>
                <th>الفرع</th>
                <th>المبلغ</th>
                <th>ملاحظات</th>
                <th>أضيف بواسطة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24 }}>جاري التحميل...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24 }}>لا توجد مصروفات</td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id}>
                  <td>{formatDate(exp.expenseDate)}</td>
                  <td style={{ fontWeight: 500 }}>{exp.description}</td>
                  <td>{exp.branchName}</td>
                  <td className="mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{exp.notes || '-'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{exp.createdBy}</td>
                  <td>
                    <button className="btn-custom btn-custom-danger btn-custom-sm"
                      onClick={() => handleDelete(exp.id)} title="حذف">
                      <BsTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BranchExpenses;
