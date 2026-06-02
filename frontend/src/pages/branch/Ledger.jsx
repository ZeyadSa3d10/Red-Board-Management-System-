import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import DataTable from '../../components/common/DataTable';
import { formatCurrency, formatDate, getToday } from '../../utils/formatters';
import { BsArrowUpCircle, BsArrowDownCircle } from 'react-icons/bs';

const TYPE_LABELS = {
  'بيع': 'بيع',
  'آجل': 'آجل',
  'مرتجع': 'مرتجع',
  'تحصيل آجل': 'تحصيل آجل',
  'مشتريات': 'مشتريات',
  'دفعات موردين': 'دفعات موردين',
  'مصروفات': 'مصروفات',
  'رواتب': 'رواتب',
};

const Ledger = () => {
  const { user } = useAuth();
  const [ledger, setLedger] = useState(null);
  const [branches, setBranches] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  const [dateFrom, setDateFrom] = useState(getToday());
  const [dateTo, setDateTo] = useState(getToday());
  const [filterBranch, setFilterBranch] = useState('');

  useEffect(() => {
    api.getBranches().then(setBranches);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [summary, paged] = await Promise.all([
          api.getLedger(dateFrom || null, dateTo || null, filterBranch || null),
          api.getLedgerFiltered({
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            branchId: filterBranch || null,
            page,
            pageSize: 15,
          }),
        ]);
        setLedger(summary);
        setEntries(paged?.items || []);
        setTotalCount(paged?.totalCount || 0);
      } catch {
        setLedger(null);
        setEntries([]);
        setTotalCount(0);
      }
      setLoading(false);
    };
    load();
  }, [dateFrom, dateTo, filterBranch, page]);

  const columns = [
    {
      key: 'date', header: 'التاريخ', width: 110,
      render: (v) => <span style={{ whiteSpace: 'nowrap' }}>{formatDate(v)}</span>,
    },
    { key: 'description', header: 'البيان', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'branchName', header: 'الفرع' },
    {
      key: 'type', header: 'النوع',
      render: (v) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 12,
          fontSize: '0.8rem', fontWeight: 500,
          background: v === 'مصروفات' || v === 'رواتب' || v === 'مشتريات' || v === 'دفعات موردين'
            ? 'var(--color-danger-light)' : 'var(--color-success-light)',
          color: v === 'مصروفات' || v === 'رواتب' || v === 'مشتريات' || v === 'دفعات موردين'
            ? 'var(--color-danger)' : 'var(--color-success)',
        }}>
          {v === 'بيع' || v === 'تحصيل آجل' ? <BsArrowUpCircle size={12} /> : <BsArrowDownCircle size={12} />}
          {TYPE_LABELS[v] || v}
        </span>
      ),
    },
    { key: 'paymentMethod', header: 'طريقة الدفع', render: (v) => <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{v || '-'}</span> },
    { key: 'inAmount', header: 'وارد', render: (v) => <span className="mono" style={{ color: v ? 'var(--color-success)' : 'var(--color-text-muted)' }}>{v ? formatCurrency(v) : '-'}</span> },
    { key: 'outAmount', header: 'صادر', render: (v) => <span className="mono" style={{ color: v ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{v ? formatCurrency(v) : '-'}</span> },
    { key: 'referenceNumber', header: 'رقم المرجع', render: (v) => <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{v || '-'}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>دفتر الأستاذ (يومية المعاملات النقدية)</h2>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="grid-3-sm" style={{ gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>من تاريخ</label>
            <input className="form-control-custom" type="date" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>إلى تاريخ</label>
            <input className="form-control-custom" type="date" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>الفرع</label>
            <select className="form-control-custom" value={filterBranch}
              onChange={e => { setFilterBranch(e.target.value); setPage(1); }}>
              <option value="">كل الفروع</option>
              {branches.filter(b => !b.isAdmin).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {ledger && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="card" style={{ padding: '16px 24px', flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>إجمالي الوارد</div>
            <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {formatCurrency(ledger.totalIn)}
            </div>
          </div>
          <div className="card" style={{ padding: '16px 24px', flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>إجمالي الصادر</div>
            <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-danger)' }}>
              {formatCurrency(ledger.totalOut)}
            </div>
          </div>
          <div className="card" style={{ padding: '16px 24px', flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>صافي</div>
            <div className="mono" style={{
              fontSize: '1.3rem', fontWeight: 700,
              color: ledger.netAmount >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
            }}>
              {formatCurrency(ledger.netAmount)}
            </div>
          </div>
          <div className="card" style={{ padding: '16px 24px', flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>عدد المعاملات</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{totalCount}</div>
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        serverSide
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
        pageSize={15}
        emptyMessage="لا توجد معاملات في هذه الفترة"
      />
    </div>
  );
};

export default Ledger;
