import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
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
  const [loading, setLoading] = useState(true);

  const [dateFrom, setDateFrom] = useState(getToday());
  const [dateTo, setDateTo] = useState(getToday());
  const [filterBranch, setFilterBranch] = useState('');

  useEffect(() => {
    api.getBranches().then(setBranches);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await api.getLedger(dateFrom || null, dateTo || null, filterBranch || null);
      setLedger(data);
      setLoading(false);
    };
    load();
  }, [dateFrom, dateTo, filterBranch]);

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
              onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>إلى تاريخ</label>
            <input className="form-control-custom" type="date" value={dateTo}
              onChange={e => setDateTo(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500 }}>الفرع</label>
            <select className="form-control-custom" value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}>
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
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{(ledger.entries || []).length}</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-custom" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>البيان</th>
                <th>الفرع</th>
                <th>النوع</th>
                <th>طريقة الدفع</th>
                <th>وارد</th>
                <th>صادر</th>
                <th>رقم المرجع</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24 }}>جاري التحميل...</td></tr>
              ) : !ledger || !ledger.entries || ledger.entries.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24 }}>لا توجد معاملات في هذه الفترة</td></tr>
              ) : ledger.entries.map((entry, idx) => (
                <tr key={idx}>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</td>
                  <td style={{ fontWeight: 500 }}>{entry.description}</td>
                  <td>{entry.branchName}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 12,
                      fontSize: '0.8rem', fontWeight: 500,
                      background: entry.type === 'مصروفات' || entry.type === 'رواتب' || entry.type === 'مشتريات' || entry.type === 'دفعات موردين'
                        ? 'var(--color-danger-light)' : 'var(--color-success-light)',
                      color: entry.type === 'مصروفات' || entry.type === 'رواتب' || entry.type === 'مشتريات' || entry.type === 'دفعات موردين'
                        ? 'var(--color-danger)' : 'var(--color-success)',
                    }}>
                      {entry.type === 'بيع' || entry.type === 'تحصيل آجل' ? <BsArrowUpCircle size={12} /> : <BsArrowDownCircle size={12} />}
                      {TYPE_LABELS[entry.type] || entry.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {entry.paymentMethod || '-'}
                  </td>
                  <td className="mono" style={{ color: entry.inAmount ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                    {entry.inAmount ? formatCurrency(entry.inAmount) : '-'}
                  </td>
                  <td className="mono" style={{ color: entry.outAmount ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                    {entry.outAmount ? formatCurrency(entry.outAmount) : '-'}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {entry.referenceNumber || '-'}
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

export default Ledger;
