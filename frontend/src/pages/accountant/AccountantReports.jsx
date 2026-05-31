import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import StatCard from '../../components/common/StatCard';
import FilterBar from '../../components/common/FilterBar';
import FilterGroup from '../../components/common/FilterGroup';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BsBarChart, BsPeople, BsTruck, BsGraphUp, BsCalendarDay, BsClock, BsBox, BsBuilding } from 'react-icons/bs';

const TABS = [
  { key: 'pnl', label: 'الأرباح والخسائر', icon: BsGraphUp },
  { key: 'daily', label: 'التقرير اليومي', icon: BsCalendarDay },
  { key: 'deferred', label: 'الآجل والعملاء', icon: BsClock },
  { key: 'products', label: 'المنتجات', icon: BsBox },
];

const PERIODS = [
  { label: 'اليوم', value: 'today' },
  { label: 'هذا الشهر', value: 'month' },
  { label: 'هذه السنة', value: 'year' },
  { label: 'مخصص', value: 'custom' },
];

const getDateRange = (period, customFrom, customTo) => {
  const now = new Date();
  if (period === 'today') {
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { dateFrom: s.toISOString(), dateTo: new Date(s.getTime() + 86400000).toISOString() };
  }
  if (period === 'month') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: s.toISOString(), dateTo: now.toISOString() };
  }
  if (period === 'year') {
    const s = new Date(now.getFullYear(), 0, 1);
    return { dateFrom: s.toISOString(), dateTo: now.toISOString() };
  }
  return { dateFrom: customFrom, dateTo: customTo };
};

const AccountantReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pnl');
  const [branches, setBranches] = useState([]);

  const [pnlPeriod, setPnlPeriod] = useState('month');
  const [pnlDateFrom, setPnlDateFrom] = useState('');
  const [pnlDateTo, setPnlDateTo] = useState('');
  const [pnlBranchId, setPnlBranchId] = useState('');
  const [pnlData, setPnlData] = useState(null);

  const [dailyDate, setDailyDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyData, setDailyData] = useState(null);

  const [defData, setDefData] = useState(null);
  const [defCollections, setDefCollections] = useState([]);
  const [defPeriod, setDefPeriod] = useState('month');

  const [prodPeriod, setProdPeriod] = useState('month');
  const [prodDateFrom, setProdDateFrom] = useState('');
  const [prodDateTo, setProdDateTo] = useState('');
  const [prodBranchId, setProdBranchId] = useState('');
  const [prodData, setProdData] = useState([]);
  const [invValue, setInvValue] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [dashData, branchData] = await Promise.all([
        api.getOwnerDashboardStats(),
        api.getBranches().catch(() => []),
      ]);
      setStats(dashData);
      setBranches(branchData.filter(b => !b.isAdminBranch));
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (activeTab !== 'pnl') return;
    const { dateFrom, dateTo } = getDateRange(pnlPeriod, pnlDateFrom, pnlDateTo);
    if (!dateFrom || !dateTo) return;
    api.getPnL(dateFrom, dateTo, pnlBranchId || undefined)
      .then(setPnlData)
      .catch(() => setPnlData(null));
  }, [activeTab, pnlPeriod, pnlDateFrom, pnlDateTo, pnlBranchId]);

  useEffect(() => {
    if (activeTab !== 'daily') return;
    api.getDailyAllBranches(dailyDate)
      .then(setDailyData)
      .catch(() => setDailyData(null));
  }, [activeTab, dailyDate]);

  useEffect(() => {
    if (activeTab !== 'deferred') return;
    const { dateFrom, dateTo } = getDateRange(defPeriod, null, null);
    Promise.all([
      api.getDeferredAging().catch(() => null),
      api.getDeferredCollections(dateFrom, dateTo).catch(() => []),
    ]).then(([aging, collections]) => {
      setDefData(aging);
      setDefCollections(collections);
    });
  }, [activeTab, defPeriod]);

  useEffect(() => {
    if (activeTab !== 'products') return;
    const { dateFrom, dateTo } = getDateRange(prodPeriod, prodDateFrom, prodDateTo);
    if (!dateFrom || !dateTo) return;
    Promise.all([
      api.getTopProductsFiltered(dateFrom, dateTo, prodBranchId || undefined, 20, 'quantity'),
      api.getInventoryValue().catch(() => null),
    ]).then(([products, inv]) => {
      setProdData(products || []);
      setInvValue(inv);
    });
  }, [activeTab, prodPeriod, prodDateFrom, prodDateTo, prodBranchId]);

  const renderTab = (key, label, Icon) => (
    <button
      key={key}
      className={`btn-custom ${activeTab === key ? 'btn-custom-accent' : 'btn-custom-outline'}`}
      style={{ fontSize: '0.9rem' }}
      onClick={() => setActiveTab(key)}
    >
      <Icon /> {label}
    </button>
  );

  if (loading) return <div className="loading-container"><div className="spinner-border" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>التقارير المالية</h2>
          <div className="page-subtitle">نظرة شاملة على أداء الفروع</div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="قيمة المخزون الكلي" value={stats?.totalInventoryValue || 0} icon={BsBarChart} color="primary" />
        <StatCard title="ديون العملاء" value={stats?.totalDeferredFromClients || 0} icon={BsPeople} color="danger" />
        <StatCard title="المستحق للموردين" value={stats?.totalDueToSuppliers || 0} icon={BsTruck} color="warning" />
      </div>

      <div className="filters-bar" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: '0 0 12px' }}>
        {TABS.map(t => renderTab(t.key, t.label, t.icon))}
      </div>

      {activeTab === 'pnl' && (
        <div className="card" style={{ padding: 24 }}>
          <FilterBar variant="panel">
            <FilterGroup label="الفترة" icon={BsCalendarDay}>
              <select className="form-control-custom" style={{ width: 140 }} value={pnlPeriod} onChange={e => setPnlPeriod(e.target.value)}>
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </FilterGroup>
            {pnlPeriod === 'custom' && (
              <>
                <FilterGroup label="من" icon={BsCalendarDay}>
                  <input type="date" className="form-control-custom" style={{ width: 160 }} value={pnlDateFrom} onChange={e => setPnlDateFrom(e.target.value)} />
                </FilterGroup>
                <FilterGroup label="إلى" icon={BsCalendarDay}>
                  <input type="date" className="form-control-custom" style={{ width: 160 }} value={pnlDateTo} onChange={e => setPnlDateTo(e.target.value)} />
                </FilterGroup>
              </>
            )}
            <FilterGroup label="الفرع" icon={BsBuilding}>
              <select className="form-control-custom" style={{ width: 160 }} value={pnlBranchId} onChange={e => setPnlBranchId(e.target.value)}>
                <option value="">كل الفروع</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FilterGroup>
          </FilterBar>

          {pnlData ? (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">إجمالي الإيرادات</div>
                <div className="stat-value mono" style={{ color: 'var(--color-accent)' }}>{formatCurrency(pnlData.totalRevenue || 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">إجمالي التكاليف</div>
                <div className="stat-value mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(pnlData.totalCost || 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">صافي الربح</div>
                <div className="stat-value mono" style={{ color: 'var(--color-success)' }}>{formatCurrency((pnlData.totalRevenue || 0) - (pnlData.totalCost || 0))}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">عدد الفواتير</div>
                <div className="stat-value">{pnlData.invoiceCount || 0}</div>
              </div>
            </div>
          ) : (
            <div className="empty-state">لا توجد بيانات</div>
          )}
        </div>
      )}

      {activeTab === 'daily' && (
        <div className="card" style={{ padding: 24 }}>
          <FilterBar variant="panel">
            <FilterGroup label="التاريخ" icon={BsCalendarDay}>
              <input type="date" className="form-control-custom" style={{ width: 200 }} value={dailyDate} onChange={e => setDailyDate(e.target.value)} />
            </FilterGroup>
          </FilterBar>

          {dailyData ? (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">إجمالي المبيعات</div>
                <div className="stat-value mono" style={{ color: 'var(--color-accent)' }}>{formatCurrency(dailyData.totalSales || 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">المرتجعات</div>
                <div className="stat-value mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(dailyData.totalReturns || 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">مدفوعات الآجل</div>
                <div className="stat-value mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(dailyData.deferredPayments || 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">الصافي</div>
                <div className="stat-value mono" style={{ color: 'var(--color-primary)' }}>{formatCurrency(dailyData.netRevenue || 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">نقداً</div>
                <div className="stat-value mono">{formatCurrency(dailyData.cashAmount || 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">فودافون كاش</div>
                <div className="stat-value mono">{formatCurrency(dailyData.vodafoneCashAmount || 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">شيكات</div>
                <div className="stat-value mono">{formatCurrency(dailyData.checkAmount || 0)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">عدد الفواتير</div>
                <div className="stat-value">{dailyData.invoicesCount || 0}</div>
              </div>
            </div>
          ) : (
            <div className="empty-state">لا توجد بيانات</div>
          )}
        </div>
      )}

      {activeTab === 'deferred' && (
        <div className="card" style={{ padding: 24 }}>
          <FilterBar variant="panel">
            <FilterGroup label="الفترة" icon={BsCalendarDay}>
              <select className="form-control-custom" style={{ width: 140 }} value={defPeriod} onChange={e => setDefPeriod(e.target.value)}>
                {PERIODS.slice(0, 3).map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </FilterGroup>
          </FilterBar>

          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">إجمالي الآجل</div>
              <div className="stat-value mono" style={{ color: 'var(--color-danger)' }}>{formatCurrency(defData?.totalDeferred || 0)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">المدفوع</div>
              <div className="stat-value mono" style={{ color: 'var(--color-success)' }}>{formatCurrency(defData?.totalPaid || 0)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">المتبقي</div>
              <div className="stat-value mono" style={{ color: 'var(--color-warning)' }}>{formatCurrency((defData?.totalDeferred || 0) - (defData?.totalPaid || 0))}</div>
            </div>
          </div>

          {defCollections?.length > 0 && (
            <div>
              <h5 style={{ fontWeight: 600, marginBottom: 12 }}>التحصيلات</h5>
              <div className="table-container">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>العميل</th>
                      <th>المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defCollections.map((c, i) => (
                      <tr key={i}>
                        <td>{formatDate(c.date)}</td>
                        <td>{c.clientName}</td>
                        <td className="mono">{formatCurrency(c.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!defCollections?.length && !defData && (
            <div className="empty-state">لا توجد بيانات</div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="card" style={{ padding: 24 }}>
          <FilterBar variant="panel">
            <FilterGroup label="الفترة" icon={BsCalendarDay}>
              <select className="form-control-custom" style={{ width: 140 }} value={prodPeriod} onChange={e => setProdPeriod(e.target.value)}>
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </FilterGroup>
            {prodPeriod === 'custom' && (
              <>
                <FilterGroup label="من" icon={BsCalendarDay}>
                  <input type="date" className="form-control-custom" style={{ width: 160 }} value={prodDateFrom} onChange={e => setProdDateFrom(e.target.value)} />
                </FilterGroup>
                <FilterGroup label="إلى" icon={BsCalendarDay}>
                  <input type="date" className="form-control-custom" style={{ width: 160 }} value={prodDateTo} onChange={e => setProdDateTo(e.target.value)} />
                </FilterGroup>
              </>
            )}
            <FilterGroup label="الفرع" icon={BsBuilding}>
              <select className="form-control-custom" style={{ width: 160 }} value={prodBranchId} onChange={e => setProdBranchId(e.target.value)}>
                <option value="">كل الفروع</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FilterGroup>
          </FilterBar>

          {invValue && (
            <div className="stat-card" style={{ marginBottom: 20 }}>
              <div className="stat-label">قيمة المخزون الإجمالية</div>
              <div className="stat-value mono" style={{ color: 'var(--color-accent)' }}>{formatCurrency(invValue.totalValue || invValue || 0)}</div>
            </div>
          )}

          {prodData?.length > 0 ? (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>المنتج</th>
                    <th>الكمية المباعة</th>
                    <th>الإيراد</th>
                  </tr>
                </thead>
                <tbody>
                  {prodData.map((p, i) => (
                    <tr key={p.id || i}>
                      <td>{i + 1}</td>
                      <td>{p.productName || p.name}</td>
                      <td className="mono">{p.totalQuantity || p.quantity || 0}</td>
                      <td className="mono">{formatCurrency(p.totalRevenue || p.revenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">لا توجد بيانات</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountantReports;
