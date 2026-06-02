import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../api/realApi';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import FilterGroup from '../../components/common/FilterGroup';
import FilterSearch from '../../components/common/FilterSearch';
import DateRangePicker from '../../components/common/DateRangePicker';
import useFilters from '../../hooks/useFilters';
import { formatCurrency, formatDate, getToday } from '../../utils/formatters';
import { BsPlus, BsTrash, BsSave } from 'react-icons/bs';

const BranchExpenses = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [expenses, setExpenses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const defaultBranch = user?.role !== 'owner' ? user?.branchId || '' : '';
  const { filters, setFilter, resetFilters, activeCount } = useFilters({
    search: '', branchId: defaultBranch, dateFrom: getToday(), dateTo: getToday(),
  }, { debounceMs: 400 });

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [expenseDate, setExpenseDate] = useState(getToday());
  const [formBranch, setFormBranch] = useState(user?.branchId || '');
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.search) params.search = filters.search;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      params.page = page;
      params.pageSize = 15;

      const data = await api.getExpenses(params);
      const items = Array.isArray(data) ? data : (data?.items || []);
      setExpenses(items);
      setTotalCount(Array.isArray(data) ? items.length : (data?.totalCount || items.length));
    } catch { setExpenses([]); setTotalCount(0); }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => { load(); }, [filters, page]);

  useEffect(() => {
    api.getBranches().then(br => setBranches(br || [])).catch(() => {});
  }, []);

  const handleReset = () => {
    resetFilters();
    setPage(1);
  };

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
    } catch { addNotification('فشل حذف المصروف', 'danger'); }
  };

  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const columns = [
    { key: 'expenseDate', header: 'التاريخ', render: (v) => formatDate(v) },
    { key: 'description', header: 'البيان', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'branchName', header: 'الفرع' },
    { key: 'amount', header: 'المبلغ', render: (v) => <span className="mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(v)}</span> },
    { key: 'notes', header: 'ملاحظات', render: (v) => <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{v || '-'}</span> },
    { key: 'createdBy', header: 'أضيف بواسطة', render: (v) => <span style={{ fontSize: '0.85rem' }}>{v}</span> },
    { key: 'actions', header: '', sortable: false, render: (_, row) => (
      <button className="btn-custom btn-custom-danger btn-custom-sm" onClick={() => handleDelete(row.id)} title="حذف">
        <BsTrash />
      </button>
    )},
  ];

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
                <select className="form-control-custom" value={formBranch} onChange={e => setFormBranch(e.target.value)}>
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
            <textarea className="form-control-custom" rows="2" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
          </div>
          <button className="btn-custom btn-custom-primary" onClick={handleSave} disabled={saving}>
            <BsSave size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      )}

      <FilterBar variant="panel" onReset={handleReset} activeCount={activeCount} loading={loading} onApply={() => setPage(1)}>
        <FilterSearch value={filters.search} onChange={v => { setFilter('search', v); setPage(1); }} placeholder="بحث بوصف المصروف..." />
        {user?.role === 'owner' && (
          <FilterGroup label="الفرع">
            <select className="form-control-custom" value={filters.branchId}
              onChange={e => { setFilter('branchId', e.target.value); setPage(1); }}>
              <option value="">كل الفروع</option>
              {branches.filter(b => !b.isAdmin).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FilterGroup>
        )}
        <DateRangePicker
          value={{ dateFrom: filters.dateFrom, dateTo: filters.dateTo }}
          onChange={({ dateFrom, dateTo }) => { setFilter('dateFrom', dateFrom); setFilter('dateTo', dateTo); setPage(1); }}
        />
      </FilterBar>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: '16px 24px', flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>إجمالي المصروفات</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-danger)' }}>
            {formatCurrency(totalAmount)}
          </div>
        </div>
        <div className="card" style={{ padding: '16px 24px', flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>عدد المعاملات</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{totalCount}</div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        serverSide
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        pageSize={15}
      />
    </div>
  );
};

export default BranchExpenses;
