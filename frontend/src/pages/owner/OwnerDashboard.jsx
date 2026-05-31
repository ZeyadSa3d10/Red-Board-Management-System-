import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import RevenueChart from '../../components/reports/RevenueChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { BsBoxes, BsPeople, BsTruck, BsReceipt, BsGraphUp, BsCurrencyDollar, BsArrowUp, BsArrowDown, BsBuilding, BsCalendar, BsCashStack, BsShieldCheck } from 'react-icons/bs';
import { formatCurrency } from '../../utils/formatters';
import '../../styles/reports.css';

const FILTERS = [
  { key: 'today', label: 'اليوم' },
  { key: 'month', label: 'هذا الشهر' },
  { key: 'year', label: 'هذه السنة' },
  { key: 'custom', label: 'مخصص' },
];

const STATS_CONFIG = [
  { key: 'totalInventoryValue', label: 'قيمة المخزون الكلي', icon: BsBoxes, color: '#2563EB', bg: '#DBEAFE' },
  { key: 'totalDeferredFromClients', label: 'ديون العملاء', icon: BsPeople, color: '#DC2626', bg: '#FEE2E2' },
  { key: 'totalDueToSuppliers', label: 'المستحق للموردين', icon: BsTruck, color: '#D97706', bg: '#FEF3C7' },
  { key: 'totalInvoicesCount', label: 'عدد الفواتير', icon: BsReceipt, color: '#6D28D9', bg: '#EDE9FE' },
  { key: 'monthlyRevenue', label: 'صافي الإيرادات', icon: BsGraphUp, color: '#DC2626', bg: '#FEE2E2' },
  { key: 'monthlyProfit', label: 'صافي الأرباح', icon: BsCashStack, color: '#16A34A', bg: '#DCFCE7' },
];

const BranchTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
      padding: '12px 16px', boxShadow: 'var(--shadow-dropdown)',
    }}>
      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color }} />
          <span style={{ color: 'var(--color-text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-numbers)' }}>
            {Number(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
          </span>
        </div>
      ))}
    </div>
  );
};

const OwnerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const now = new Date();
    let from = null, to = null;

    if (filter === 'today') {
      from = now.toISOString().slice(0, 10);
      to = now.toISOString().slice(0, 10);
    } else if (filter === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      to = now.toISOString().slice(0, 10);
    } else if (filter === 'year') {
      from = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      to = now.toISOString().slice(0, 10);
    } else if (filter === 'custom' && dateFrom && dateTo) {
      from = dateFrom;
      to = dateTo;
    }

    if (filter !== 'custom' || (dateFrom && dateTo)) {
      setLoading(true);
      api.getOwnerDashboardStats(from, to).then(data => {
        setStats(data);
        setLoading(false);
      });
    }
  }, [filter, dateFrom, dateTo]);

  if (loading && !stats) {
    return (
      <div className="loading-container">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  const bestBranch = stats?.branchComparison?.length
    ? stats.branchComparison.reduce((a, b) => a.revenue > b.revenue ? a : b)
    : null;

  const totalRevenue = stats?.branchComparison?.reduce((s, b) => s + b.revenue, 0) || 0;
  const totalProfit = stats?.branchComparison?.reduce((s, b) => s + b.profit, 0) || 0;

  return (
    <div className="page-container">
      {/* Premium Header */}
      <div className="reports-header">
        <div className="reports-header-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>لوحة تحكم المالك</h1>
              <div className="subtitle">نظرة شاملة على أداء المنشأة والفروع</div>
            </div>
          </div>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <BsCalendar size={14} style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 8 }} />
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: '5px 16px', borderRadius: 20, border: f.key === filter ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  background: f.key === filter ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)',
                  color: f.key === filter ? 'white' : 'rgba(255,255,255,0.8)',
                  fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
                  backdropFilter: 'blur(4px)', fontFamily: 'var(--font-primary)',
                  transition: 'all var(--transition-fast)',
                }}
              >{f.label}</button>
            ))}
            {filter === 'custom' && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-primary)' }} />
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--text-sm)' }}>إلى</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-primary)' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="kpi-bar">
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-primary)' }} />
          <div className="kpi-overline">إجمالي الفروع</div>
          <div className="kpi-label">{stats?.branchComparison?.length || 0} فرع</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-accent)' }} />
          <div className="kpi-overline">إجمالي الإيرادات</div>
          <div className="kpi-value" style={{ color: 'var(--color-accent)', fontSize: 'var(--text-base)' }}>{formatCurrency(totalRevenue)}</div>
        </div>
        <div className="kpi-item">
          <div className="kpi-accent-line" style={{ background: 'var(--color-success)' }} />
          <div className="kpi-overline">إجمالي الأرباح</div>
          <div className="kpi-value" style={{ color: 'var(--color-success)', fontSize: 'var(--text-base)' }}>{formatCurrency(totalProfit)}</div>
        </div>
        {bestBranch && (
          <div className="kpi-item">
            <div className="kpi-accent-line" style={{ background: 'var(--color-warning)' }} />
            <div className="kpi-overline">أفضل فرع</div>
            <div className="kpi-label">{bestBranch.branchName}</div>
            <div className="kpi-value" style={{ color: 'var(--color-warning)', fontSize: 'var(--text-base)' }}>{formatCurrency(bestBranch.revenue)}</div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="stats-grid-premium">
        {STATS_CONFIG.map(cfg => {
          const val = stats?.[cfg.key] ?? 0;
          const isCurrency = cfg.key !== 'totalInvoicesCount';
          return (
            <div key={cfg.key} className="stat-card-premium">
              <div className="stat-icon" style={{ background: cfg.bg, color: cfg.color }}>
                <cfg.icon />
              </div>
              <div className="stat-label">{cfg.label}</div>
              <div className="stat-number" style={{ color: cfg.color }}>
                {isCurrency ? formatCurrency(val) : val.toLocaleString('en-US')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid-2">
        {/* Revenue Trend */}
        <div className="card-premium" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h6><BsGraphUp /> الاتجاه الشهري للإيرادات والأرباح</h6>
          </div>
          <div className="chart-wrapper" style={{ minHeight: 280 }}>
            {stats?.monthlyData?.length > 0
              ? <RevenueChart data={stats.monthlyData} />
              : <div className="empty-state-modern"><h4>لا توجد بيانات كافية</h4></div>
            }
          </div>
        </div>

        {/* Branch Comparison Chart */}
        <div className="card-premium" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h6><BsBuilding /> مقارنة الفروع</h6>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-3)' }}>
            {stats?.branchComparison?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.branchComparison} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                  <XAxis dataKey="branchName" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<BranchTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 4 }}
                    formatter={(v) => <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{v}</span>}
                  />
                  <Bar dataKey="revenue" fill="var(--color-primary)" name="الإيرادات" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="profit" fill="var(--color-accent)" name="الأرباح" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state-modern" style={{ padding: '40px 0' }}>
                <h4>لا توجد بيانات</h4>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Branch Details Table */}
      {stats?.branchComparison?.length > 0 && (
        <div className="card-premium">
          <div className="card-header">
            <h6><BsBuilding /> تفاصيل أداء الفروع</h6>
            <span className="section-badge">{stats.branchComparison.length} فرع</span>
          </div>
          <div className="card-body p-0">
            <div className="table-container">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الفرع</th>
                    <th>الإيرادات</th>
                    <th>الأرباح</th>
                    <th>نسبة الربح</th>
                    <th>عدد الفواتير</th>
                    <th>متوسط الفاتورة</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.branchComparison]
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((b, i) => {
                      const margin = b.revenue > 0 ? ((b.profit / b.revenue) * 100) : 0;
                      const avgInvoice = b.invoicesCount > 0 ? (b.revenue / b.invoicesCount) : 0;
                      const rankCls = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default';
                      return (
                        <tr key={b.branchId}>
                          <td><span className={`rank-badge ${rankCls}`}>{i + 1}</span></td>
                          <td style={{ fontWeight: 600 }}>{b.branchName}</td>
                          <td className="mono" style={{ fontWeight: 600 }}>{formatCurrency(b.revenue)}</td>
                          <td className="mono" style={{ color: b.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>{formatCurrency(b.profit)}</td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 50, height: 6, background: 'var(--color-bg)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(margin, 100)}%`, background: margin >= 20 ? 'var(--color-success)' : margin >= 10 ? 'var(--color-warning)' : 'var(--color-danger)', borderRadius: 3 }} />
                              </div>
                              <span className="mono" style={{ fontSize: 'var(--text-xs)' }}>{margin.toFixed(1)}%</span>
                            </span>
                          </td>
                          <td>{b.invoicesCount}</td>
                          <td className="mono" style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(avgInvoice)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && !stats && (
        <div className="empty-state-modern">
          <div className="empty-icon-wrapper"><BsGraphUp /></div>
          <h4>لا توجد بيانات</h4>
          <p>لم يتم العثور على بيانات لعرضها</p>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
