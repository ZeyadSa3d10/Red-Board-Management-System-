import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/realApi";
import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
} from "../../utils/formatters";
import RevenueChart from "../../components/reports/RevenueChart";
import BranchComparison from "../../components/reports/BranchComparison";
import ProfitChart from "../../components/reports/ProfitChart";
import PnlMiniChart from "../../components/reports/PnlMiniChart";
import PaymentPieChart from "../../components/reports/PaymentPieChart";
import TopProductsChart from "../../components/reports/TopProductsChart";
import AgingStackChart from "../../components/reports/AgingStackChart";
import CollectionsChart from "../../components/reports/CollectionsChart";
import SalaryChart from "../../components/reports/SalaryChart";
import BranchRevenueDonut from "../../components/reports/BranchRevenueDonut";
import LedgerFlowChart from "../../components/reports/LedgerFlowChart";
import FilterBar from "../../components/common/FilterBar";
import FilterGroup from "../../components/common/FilterGroup";
import FilterActions from "../../components/common/FilterActions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  BsPrinter,
  BsDownload,
  BsGraphUp,
  BsCalendarDay,
  BsBuilding,
  BsBox,
  BsClock,
  BsCashStack,
  BsArrowUp,
  BsArrowDown,
  BsCart3,
  BsPercent,
  BsReceipt,
  BsPeople,
  BsTruck,
  BsExclamationTriangle,
  BsCheckCircle,
  BsShieldCheck,
  BsCreditCard,
  BsBank,
  BsChevronLeft,
  BsChevronRight,
  BsFileEarmarkText,
  BsSearch,
} from "react-icons/bs";
import "../../styles/reports.css";

const BranchDailyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip" style={{ minWidth: 160 }}>
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row" style={{ justifyContent: 'flex-start', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color, flexShrink: 0 }} />
          <span>{p.name}:</span>
          <span className="chart-tooltip-value">
            {Number(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
          </span>
        </div>
      ))}
    </div>
  );
};

const SingleBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      <div className="chart-tooltip-row">
        القيمة: <span className="chart-tooltip-value">{Number(d.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م</span>
      </div>
    </div>
  );
};

const TABS = [
  { key: "pnl", label: "الأرباح والخسائر", icon: BsGraphUp },
  { key: "daily", label: "التقرير اليومي", icon: BsCalendarDay },
  { key: "branches", label: "مقارنة الفروع", icon: BsBuilding },
  { key: "products", label: "المنتجات", icon: BsBox },
  { key: "deferred", label: "الآجل والعملاء", icon: BsClock },
  { key: "salary", label: "الرواتب", icon: BsCashStack },
  { key: "ledger", label: "دفتر الأستاذ والمالية", icon: BsFileEarmarkText },
];

const PERIODS = [
  { value: "today", label: "اليوم" },
  { value: "month", label: "هذا الشهر" },
  { value: "year", label: "هذه السنة" },
  { value: "custom", label: "مخصص" },
];

const MiniSparkline = ({ data = [], strokeColor }) => {
  if (!data || !data.length) return null;
  return (
    <div className="stat-card-sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <Area
            type="monotone"
            dataKey="val"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={strokeColor}
            fillOpacity={0.06}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const OwnerReports = () => {
  const [activeTab, setActiveTab] = useState("pnl");
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // SEO Dynamic Title Effect
  useEffect(() => {
    const tabObj = TABS.find((t) => t.key === activeTab);
    document.title = `${tabObj ? tabObj.label : "التقارير الشاملة"} | لوحة المدير`;
  }, [activeTab]);

  const [pnlPeriod, setPnlPeriod] = useState("month");
  const [pnlDateFrom, setPnlDateFrom] = useState("");
  const [pnlDateTo, setPnlDateTo] = useState("");
  const [pnlBranchId, setPnlBranchId] = useState("");
  const [pnlData, setPnlData] = useState(null);

  const [dailyDate, setDailyDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dailyData, setDailyData] = useState([]);

  const [bcPeriod, setBcPeriod] = useState("month");
  const [bcDateFrom, setBcDateFrom] = useState("");
  const [bcDateTo, setBcDateTo] = useState("");
  const [bcData, setBcData] = useState([]);

  const [prodPeriod, setProdPeriod] = useState("year");
  const [prodDateFrom, setProdDateFrom] = useState("");
  const [prodDateTo, setProdDateTo] = useState("");
  const [prodBranchId, setProdBranchId] = useState("");
  const [prodSortBy, setProdSortBy] = useState("revenue");
  const [prodLimit, setProdLimit] = useState(10);
  const [prodData, setProdData] = useState([]);
  const [invData, setInvData] = useState([]);
  const [prodChartMetric, setProdChartMetric] = useState("revenue");
  const [prodSearchQuery, setProdSearchQuery] = useState("");

  const [defPeriod, setDefPeriod] = useState("month");
  const [defDateFrom, setDefDateFrom] = useState("");
  const [defDateTo, setDefDateTo] = useState("");
  const [defAging, setDefAging] = useState(null);
  const [defCollections, setDefCollections] = useState([]);

  const [salMonth, setSalMonth] = useState(
    (new Date().getMonth() + 1).toString(),
  );
  const [salYear, setSalYear] = useState(new Date().getFullYear().toString());
  const [salBranchId, setSalBranchId] = useState("");
  const [salData, setSalData] = useState(null);

  const [ledPeriod, setLedPeriod] = useState("month");
  const [ledDateFrom, setLedDateFrom] = useState("");
  const [ledDateTo, setLedDateTo] = useState("");
  const [ledBranchId, setLedBranchId] = useState("");
  const [ledData, setLedData] = useState(null);
  const [ledSearchQuery, setLedSearchQuery] = useState("");

  useEffect(() => {
    api.getBranches().then((b) => {
      setBranches(b.filter((br) => !br.isAdmin));
    });
  }, []);

  const getDateRange = useCallback((period, from, to) => {
    const now = new Date();
    if (period === "today") {
      const d = now.toISOString().split("T")[0];
      return { dateFrom: d, dateTo: d };
    }
    if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        dateFrom: start.toISOString().split("T")[0],
        dateTo: now.toISOString().split("T")[0],
      };
    }
    if (period === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      return {
        dateFrom: start.toISOString().split("T")[0],
        dateTo: now.toISOString().split("T")[0],
      };
    }
    return {
      dateFrom: from,
      dateTo: to || new Date().toISOString().split("T")[0],
    };
  }, []);

  useEffect(() => {
    if (activeTab === "pnl") {
      const { dateFrom, dateTo } = getDateRange(
        pnlPeriod,
        pnlDateFrom,
        pnlDateTo,
      );
      setLoading(true);
      api.getPnL(dateFrom, dateTo, pnlBranchId || null).then((d) => {
        setPnlData(d);
        setLoading(false);
      });
    } else if (activeTab === "daily") {
      setLoading(true);
      api.getDailyAllBranches(dailyDate).then((d) => {
        setDailyData(d);
        setLoading(false);
      });
    } else if (activeTab === "branches") {
      const { dateFrom, dateTo } = getDateRange(bcPeriod, bcDateFrom, bcDateTo);
      setLoading(true);
      api.getBranchComparison(dateFrom, dateTo).then((d) => {
        setBcData(d);
        setLoading(false);
      });
    } else if (activeTab === "products") {
      const { dateFrom, dateTo } = getDateRange(
        prodPeriod,
        prodDateFrom,
        prodDateTo,
      );
      setLoading(true);
      Promise.all([
        api.getTopProductsFiltered(
          dateFrom,
          dateTo,
          prodBranchId || null,
          prodLimit,
          prodSortBy,
        ),
        api.getInventoryValue(),
      ]).then(([p, i]) => {
        setProdData(p);
        setInvData(i);
        setLoading(false);
      });
    } else if (activeTab === "deferred") {
      const { dateFrom, dateTo } = getDateRange(
        defPeriod,
        defDateFrom,
        defDateTo,
      );
      setLoading(true);
      Promise.all([
        api.getDeferredAging(),
        api.getDeferredCollections(dateFrom, dateTo),
      ]).then(([a, c]) => {
        setDefAging(a);
        setDefCollections(c);
        setLoading(false);
      });
    } else if (activeTab === "salary") {
      setLoading(true);
      api
        .getSalarySummaryDetailed(
          Number(salMonth),
          Number(salYear),
          salBranchId || null,
        )
        .then((d) => {
          setSalData(d);
          setLoading(false);
        });
    } else if (activeTab === "ledger") {
      const { dateFrom, dateTo } = getDateRange(
        ledPeriod,
        ledDateFrom,
        ledDateTo,
      );
      setLoading(true);
      api.getLedger(dateFrom, dateTo, ledBranchId || null).then((d) => {
        setLedData(d);
        setLoading(false);
      });
    }
  }, [
    activeTab,
    pnlPeriod,
    pnlDateFrom,
    pnlDateTo,
    pnlBranchId,
    dailyDate,
    bcPeriod,
    bcDateFrom,
    bcDateTo,
    prodPeriod,
    prodDateFrom,
    prodDateTo,
    prodBranchId,
    prodSortBy,
    prodLimit,
    defPeriod,
    defDateFrom,
    defDateTo,
    salMonth,
    salYear,
    salBranchId,
    ledPeriod,
    ledDateFrom,
    ledDateTo,
    ledBranchId,
    getDateRange,
  ]);

  // Analytics & Aggregations Memos
  const processedMonthlyData = useMemo(() => {
    if (!pnlData?.monthlyData) return [];
    return pnlData.monthlyData.map((m) => {
      const rev = m.revenue || 0;
      const prof = m.profit || 0;
      return {
        ...m,
        cost: rev - prof,
        profitMargin: rev > 0 ? Math.round((prof / rev) * 100) : 0,
      };
    });
  }, [pnlData]);

  const pnlSparklines = useMemo(() => {
    if (!processedMonthlyData.length) return { rev: [], profit: [], cost: [], margin: [] };
    return {
      rev: processedMonthlyData.map(m => ({ val: m.revenue })),
      profit: processedMonthlyData.map(m => ({ val: m.profit })),
      cost: processedMonthlyData.map(m => ({ val: m.cost })),
      margin: processedMonthlyData.map(m => ({ val: m.profitMargin }))
    };
  }, [processedMonthlyData]);

  const filteredProdData = useMemo(() => {
    if (!prodSearchQuery) return prodData;
    return prodData.filter(p => 
      p.productName?.toLowerCase().includes(prodSearchQuery.toLowerCase()) || 
      (p.barcode && p.barcode.toLowerCase().includes(prodSearchQuery.toLowerCase()))
    );
  }, [prodData, prodSearchQuery]);

  const riskSummary = useMemo(() => {
    if (!defAging?.clients?.length) return { critical: 0, alert: 0, safe: 0 };
    let critical = 0, alert = 0, safe = 0;
    defAging.clients.forEach(c => {
      if (c.daysOver90 > 0 || c.creditUsagePercent >= 90) {
        critical++;
      } else if (c.days61to90 > 0 || c.creditUsagePercent >= 75) {
        alert++;
      } else {
        safe++;
      }
    });
    return { critical, alert, safe };
  }, [defAging]);

  const filteredLedgerEntries = useMemo(() => {
    if (!ledData?.entries) return [];
    if (!ledSearchQuery) return ledData.entries;
    return ledData.entries.filter(e => 
      e.description?.toLowerCase().includes(ledSearchQuery.toLowerCase()) ||
      e.branchName?.toLowerCase().includes(ledSearchQuery.toLowerCase()) ||
      e.type?.toLowerCase().includes(ledSearchQuery.toLowerCase()) ||
      (e.referenceNumber && e.referenceNumber.toLowerCase().includes(ledSearchQuery.toLowerCase()))
    );
  }, [ledData, ledSearchQuery]);

  const ledgerSparklines = useMemo(() => {
    if (!ledData?.entries?.length) return { inData: [], outData: [], balData: [] };
    const daily = {};
    ledData.entries.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date.endsWith('Z') ? e.date : e.date + 'Z').toLocaleDateString('en-CA');
      if (!daily[d]) daily[d] = { date: d, in: 0, out: 0 };
      daily[d].in += e.inAmount || 0;
      daily[d].out += e.outAmount || 0;
    });
    const sorted = Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));
    let bal = 0;
    const inData = [];
    const outData = [];
    const balData = [];
    sorted.forEach(s => {
      bal += (s.in - s.out);
      inData.push({ val: s.in });
      outData.push({ val: s.out });
      balData.push({ val: bal });
    });
    return { inData, outData, balData };
  }, [ledData]);

  const handlePrint = () => window.print();
  const handleExportCSV = (data, filename, columns) => {
    if (!data?.length) return;
    const header = columns.map((c) => c.label).join(",");
    const rows = data.map((row) => columns.map((c) => c.value(row)).join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderRankBadge = (i) => {
    const cls =
      i === 0
        ? "rank-1"
        : i === 1
          ? "rank-2"
          : i === 2
            ? "rank-3"
            : "rank-default";
    return <span className={`rank-badge ${cls}`}>{i + 1}</span>;
  };

  const renderProgressBar = (value, max = 100) => {
    const pct = Math.min((value / max) * 100, 100);
    const cls =
      pct >= 80
        ? "progress-fill-danger"
        : pct >= 50
          ? "progress-fill-warn"
          : "progress-fill-safe";
    return (
      <div className="progress-bar-wrapper">
        <div className="progress-track">
          <div
            className={`progress-fill ${cls}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            minWidth: 36,
            textAlign: "left",
            fontFamily: "var(--font-numbers)",
          }}
        >
          {pct.toFixed(0)}%
        </span>
      </div>
    );
  };

  const renderTab = (key, label, Icon) => (
    <button
      key={key}
      className={`reports-tab${activeTab === key ? " active" : ""}`}
      onClick={() => setActiveTab(key)}
    >
      <Icon /> {label}
    </button>
  );

  const Loader = () => (
    <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
      <div className="stats-grid-premium">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="stat-card-premium" style={{ border: '1px solid var(--color-border-light)' }}>
            <div className="skeleton-text" style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', marginBottom: 12 }} />
            <div className="skeleton-text" style={{ width: '60%', height: 14, marginBottom: 8 }} />
            <div className="skeleton-text" style={{ width: '40%', height: 24 }} />
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card-premium">
          <div className="card-header">
            <div className="skeleton-text" style={{ width: '30%', height: 18 }} />
          </div>
          <div className="chart-wrapper" style={{ minHeight: 280 }}>
            <div className="skeleton-text" style={{ width: '100%', height: 260, borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
        <div className="card-premium">
          <div className="card-header">
            <div className="skeleton-text" style={{ width: '40%', height: 18 }} />
          </div>
          <div className="chart-wrapper" style={{ minHeight: 280 }}>
            <div className="skeleton-text" style={{ width: '100%', height: 260, borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="reports-header">
        <div className="reports-header-content">
          <div className="reports-header-top">
            <div>
              <h1>التقارير الشاملة</h1>
              <div className="subtitle">
                تحليلات متقدمة ومقارنات أداء لجميع فروعك
              </div>
            </div>
          </div>
          <div className="reports-header-actions">
            <button onClick={handlePrint}>
              <BsPrinter /> طباعة
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        {TABS.map((t) => renderTab(t.key, t.label, t.icon))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {loading ? (
          <Loader />
        ) : (
          <>
            {/* ==================== PnL Tab ==================== */}
            {activeTab === "pnl" && (
              <div>
                <FilterBar variant="panel">
                  <FilterGroup label="الفترة" icon={BsCalendarDay}>
                    <select
                      className="form-control-custom"
                      value={pnlPeriod}
                      onChange={(e) => setPnlPeriod(e.target.value)}
                    >
                      {PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                  {pnlPeriod === "custom" && (
                    <>
                      <FilterGroup label="من" icon={BsCalendarDay}>
                        <input
                          className="form-control-custom"
                          type="date"
                          value={pnlDateFrom}
                          onChange={(e) => setPnlDateFrom(e.target.value)}
                        />
                      </FilterGroup>
                      <FilterGroup label="إلى" icon={BsCalendarDay}>
                        <input
                          className="form-control-custom"
                          type="date"
                          value={pnlDateTo}
                          onChange={(e) => setPnlDateTo(e.target.value)}
                        />
                      </FilterGroup>
                    </>
                  )}
                  <FilterGroup label="الفرع" icon={BsBuilding}>
                    <select
                      className="form-control-custom"
                      value={pnlBranchId}
                      onChange={(e) => setPnlBranchId(e.target.value)}
                    >
                      <option value="">كل الفروع</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                </FilterBar>

                {pnlData && (
                  <>
                    <div className="stats-grid-premium">
                      <div className="stat-card-premium var-info" id="pnl-kpi-revenue">
                        <div className="stat-icon"><BsGraphUp /></div>
                        <div className="stat-label">إجمالي الإيرادات</div>
                        <div className="stat-number">{formatCurrency(pnlData.totalRevenue)}</div>
                        <MiniSparkline data={pnlSparklines.rev} strokeColor="#2563EB" />
                      </div>
                      <div className="stat-card-premium var-danger" id="pnl-kpi-returns">
                        <div className="stat-icon"><BsArrowDown /></div>
                        <div className="stat-label">المرتجعات</div>
                        <div className="stat-number">{formatCurrency(pnlData.totalReturns)}</div>
                      </div>
                      <div className="stat-card-premium var-success" id="pnl-kpi-net-revenue">
                        <div className="stat-icon"><BsShieldCheck /></div>
                        <div className="stat-label">صافي الإيرادات</div>
                        <div className="stat-number">{formatCurrency(pnlData.netRevenue)}</div>
                        <MiniSparkline data={pnlSparklines.rev} strokeColor="#16A34A" />
                      </div>
                      <div className="stat-card-premium var-warning" id="pnl-kpi-cogs">
                        <div className="stat-icon"><BsTruck /></div>
                        <div className="stat-label">تكلفة البضاعة (COGS)</div>
                        <div className="stat-number">{formatCurrency(pnlData.cogs)}</div>
                        <MiniSparkline data={pnlSparklines.cost} strokeColor="#D97706" />
                      </div>
                      <div className="stat-card-premium var-success" id="pnl-kpi-gross-profit">
                        <div className="stat-icon"><BsGraphUp /></div>
                        <div className="stat-label">إجمالي الربح</div>
                        <div className="stat-number">{formatCurrency(pnlData.grossProfit)}</div>
                        <MiniSparkline data={pnlSparklines.profit} strokeColor="#16A34A" />
                      </div>
                      <div className="stat-card-premium var-purple" id="pnl-kpi-margin">
                        <div className="stat-icon"><BsPercent /></div>
                        <div className="stat-label">هامش الربح</div>
                        <div className="stat-number">{pnlData.grossProfitMargin}%</div>
                        <MiniSparkline data={pnlSparklines.margin} strokeColor="#8B5CF6" />
                      </div>
                      <div className="stat-card-premium var-indigo" id="pnl-kpi-invoices">
                        <div className="stat-icon"><BsReceipt /></div>
                        <div className="stat-label">عدد الفواتير</div>
                        <div className="stat-number">{pnlData.invoicesCount}</div>
                      </div>
                      <div className="stat-card-premium var-pink" id="pnl-kpi-avg-invoice">
                        <div className="stat-icon"><BsCart3 /></div>
                        <div className="stat-label">متوسط الفاتورة</div>
                        <div className="stat-number">{formatCurrency(pnlData.averageInvoiceValue)}</div>
                      </div>
                    </div>
                    {processedMonthlyData.length > 0 && (
                      <>
                        <div className="grid-2" style={{ marginBottom: 20 }}>
                          <div className="card-premium">
                            <div className="card-header">
                              <h6>
                                <BsGraphUp /> الاتجاه الشهري
                              </h6>
                            </div>
                            <div className="chart-wrapper">
                              <RevenueChart data={processedMonthlyData} />
                            </div>
                          </div>
                          <div className="card-premium">
                            <div className="card-header">
                              <h6>
                                <BsPercent /> الإيرادات vs التكلفة والهامش
                              </h6>
                            </div>
                            <div className="chart-wrapper">
                              <PnlMiniChart monthlyData={processedMonthlyData} />
                            </div>
                          </div>
                        </div>

                        <div className="card-premium" id="pnl-monthly-table-card">
                          <div className="card-header">
                            <h6>
                              <BsFileEarmarkText /> تفاصيل الحركة الشهرية
                            </h6>
                          </div>
                          <div className="card-body p-0">
                            <div className="table-container">
                              <table className="table-premium">
                                <thead>
                                  <tr>
                                    <th>الشهر</th>
                                    <th>الإيرادات (صافي)</th>
                                    <th>تكلفة المبيعات</th>
                                    <th>صافي الأرباح</th>
                                    <th>هامش الربح %</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {processedMonthlyData.map((m, idx) => (
                                    <tr key={idx}>
                                      <td style={{ fontWeight: 600 }}>{m.month}</td>
                                      <td className="mono">{formatCurrency(m.revenue)}</td>
                                      <td className="mono">{formatCurrency(m.cost)}</td>
                                      <td className="mono" style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                                        {formatCurrency(m.profit)}
                                      </td>
                                      <td>
                                        <span className="margin-bar">
                                          <span className="margin-track">
                                            <span className="margin-fill" style={{
                                              width: `${Math.min(Math.max(m.profitMargin || 0, 0), 100)}%`,
                                              background: (m.profitMargin || 0) >= 30 ? 'var(--color-success)' : (m.profitMargin || 0) >= 15 ? 'var(--color-warning)' : 'var(--color-danger)',
                                            }} />
                                          </span>
                                          <span className="mono">{m.profitMargin}%</span>
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ==================== Daily Tab ==================== */}
            {activeTab === "daily" && (
              <div>
                <FilterBar variant="panel">
                  <FilterGroup label="التاريخ" icon={BsCalendarDay}>
                    <input
                      className="form-control-custom"
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                    />
                  </FilterGroup>
                  <FilterActions>
                    <button
                      className="btn-custom btn-custom-outline btn-custom-sm"
                      onClick={() =>
                        handleExportCSV(dailyData, "التقرير_اليومي", [
                          { label: "الفرع", value: (r) => r.branchName },
                          { label: "نقدي", value: (r) => r.cashAmount },
                          { label: "فودافون كاش", value: (r) => r.vodafoneCashAmount },
                          { label: "شيك", value: (r) => r.checkAmount },
                          { label: "آجل بيع", value: (r) => r.deferredSales },
                          {
                            label: "آجل محصل",
                            value: (r) => r.deferredCollected,
                          },
                          { label: "مرتجعات", value: (r) => r.returns },
                          { label: "صافي", value: (r) => r.netRevenue },
                        ])
                      }
                    >
                      <BsDownload /> CSV
                    </button>
                  </FilterActions>
                </FilterBar>

                {dailyData.length > 0 && (
                  <>
                    <div className="kpi-bar">
                      {(() => {
                        const totalSales = dailyData.reduce(
                          (s, r) =>
                            s +
                            r.cashAmount +
                            r.vodafoneCashAmount +
                            r.checkAmount +
                            (r.deferredSales || 0),
                          0,
                        );
                        const totalReturns = dailyData.reduce(
                          (s, r) => s + r.returns,
                          0,
                        );
                        const netTotal = dailyData.reduce(
                          (s, r) => s + r.netRevenue,
                          0,
                        );
                        return (
                          <>
                            <div className="kpi-item">
                              <div
                                className="kpi-accent-line"
                                style={{ background: "var(--color-info)" }}
                              />
                              <div className="kpi-overline">
                                إجمالي المبيعات
                              </div>
                              <div
                                className="kpi-value"
                                style={{ color: "var(--color-info)" }}
                              >
                                {formatCurrency(totalSales)}
                              </div>
                            </div>
                            <div className="kpi-item">
                              <div
                                className="kpi-accent-line"
                                style={{ background: "var(--color-danger)" }}
                              />
                              <div className="kpi-overline">
                                إجمالي المرتجعات
                              </div>
                              <div
                                className="kpi-value"
                                style={{ color: "var(--color-danger)" }}
                              >
                                {formatCurrency(totalReturns)}
                              </div>
                            </div>
                            <div className="kpi-item">
                              <div
                                className="kpi-accent-line"
                                style={{ background: "var(--color-success)" }}
                              />
                              <div className="kpi-overline">صافي الإيرادات</div>
                              <div
                                className="kpi-value"
                                style={{ color: "var(--color-success)" }}
                              >
                                {formatCurrency(netTotal)}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="grid-2" style={{ marginBottom: 20 }}>
                      <div className="card-premium" style={{ marginBottom: 0 }}>
                        <div className="card-header">
                          <h6>
                            <BsCreditCard /> توزيع طرق الدفع
                          </h6>
                        </div>
                        <div
                          className="card-body"
                          style={{ padding: "var(--space-3)" }}
                        >
                          <PaymentPieChart
                            cashAmount={dailyData.reduce(
                              (s, r) => s + r.cashAmount,
                              0,
                            )}
                            vodafoneCashAmount={dailyData.reduce(
                              (s, r) => s + r.vodafoneCashAmount,
                              0,
                            )}
                            checkAmount={dailyData.reduce(
                              (s, r) => s + r.checkAmount,
                              0,
                            )}
                            deferredSales={dailyData.reduce(
                              (s, r) => s + (r.deferredSales || 0),
                              0,
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="card-premium" style={{ marginBottom: 0 }}>
                        <div className="card-header">
                          <h6>
                            <BsBuilding /> مساهمة الفروع في إيراد اليوم
                          </h6>
                        </div>
                        <div
                          className="card-body"
                          style={{ padding: "var(--space-3)" }}
                        >
                          <BranchRevenueDonut dailyData={dailyData} />
                        </div>
                      </div>
                    </div>

                    <div className="card-premium" style={{ marginBottom: 20 }} id="daily-branch-performance-card">
                      <div className="card-header">
                        <h6>
                          <BsBank /> أداء الفروع اليومي (حسب طريقة التحصيل)
                        </h6>
                      </div>
                        <div
                          className="card-body"
                          style={{ padding: "var(--space-3)" }}
                        >
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart
                              data={dailyData}
                              margin={{
                                top: 5,
                                right: 10,
                                left: 10,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--color-border-light)"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="branchName"
                                tick={{
                                  fill: "var(--color-text-muted)",
                                  fontSize: 11,
                                }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{
                                  fill: "var(--color-text-muted)",
                                  fontSize: 11,
                                }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip content={<BranchDailyTooltip />} />
                              <Legend wrapperStyle={{ paddingTop: 4 }} />
                              <Bar
                                dataKey="cashAmount"
                                fill="#16A34A"
                                name="نقدي"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={20}
                              />
                              <Bar
                                dataKey="vodafoneCashAmount"
                                fill="#2563EB"
                                name="فودافون كاش"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={20}
                              />
                              <Bar
                                dataKey="checkAmount"
                                fill="#D97706"
                                name="شيك"
                                radius={[3, 3, 0, 0]}
                                maxBarSize={20}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="card-premium">
                      <div className="card-header">
                        <h6>
                          <BsCalendarDay /> تفاصيل الفروع
                        </h6>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-container">
                          <table className="table-premium">
                            <thead>
                              <tr>
                                <th>الفرع</th>
                                <th>نقدي</th>
                                <th>فودافون كاش</th>
                                <th>شيك</th>
                                <th>آجل بيع</th>
                                <th>آجل محصّل</th>
                                <th>مرتجعات</th>
                                <th>صافي اليوم</th>
                                <th>الفواتير</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dailyData.map((r, i) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: 600 }}>
                                    {r.branchName}
                                  </td>
                                  <td className="mono">
                                    {formatCurrency(r.cashAmount)}
                                  </td>
                                  <td className="mono">
                                    {formatCurrency(r.vodafoneCashAmount)}
                                  </td>
                                  <td className="mono">
                                    {formatCurrency(r.checkAmount)}
                                  </td>
                                  <td className="mono">
                                    {formatCurrency(r.deferredSales)}
                                  </td>
                                  <td className="mono">
                                    {formatCurrency(r.deferredCollected)}
                                  </td>
                                  <td
                                    className="mono"
                                    style={{
                                      color:
                                        r.returns > 0
                                          ? "var(--color-danger)"
                                          : "inherit",
                                    }}
                                  >
                                    {formatCurrency(r.returns)}
                                  </td>
                                  <td
                                    className="mono"
                                    style={{
                                      fontWeight: 700,
                                      color:
                                        r.netRevenue >= 0
                                          ? "var(--color-success)"
                                          : "var(--color-danger)",
                                    }}
                                  >
                                    {formatCurrency(r.netRevenue)}
                                  </td>
                                  <td>{r.invoicesCount}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td>الإجمالي</td>
                                <td className="mono">
                                  {formatCurrency(
                                    dailyData.reduce(
                                      (s, r) => s + r.cashAmount,
                                      0,
                                    ),
                                  )}
                                </td>
                                <td className="mono">
                                  {formatCurrency(
                                    dailyData.reduce(
                                      (s, r) => s + r.vodafoneCashAmount,
                                      0,
                                    ),
                                  )}
                                </td>
                                <td className="mono">
                                  {formatCurrency(
                                    dailyData.reduce(
                                      (s, r) => s + r.checkAmount,
                                      0,
                                    ),
                                  )}
                                </td>
                                <td className="mono">
                                  {formatCurrency(
                                    dailyData.reduce(
                                      (s, r) => s + r.deferredSales,
                                      0,
                                    ),
                                  )}
                                </td>
                                <td className="mono">
                                  {formatCurrency(
                                    dailyData.reduce(
                                      (s, r) => s + r.deferredCollected,
                                      0,
                                    ),
                                  )}
                                </td>
                                <td className="mono">
                                  {formatCurrency(
                                    dailyData.reduce(
                                      (s, r) => s + r.returns,
                                      0,
                                    ),
                                  )}
                                </td>
                                <td
                                  className="mono"
                                  style={{ color: "var(--color-accent)" }}
                                >
                                  {formatCurrency(
                                    dailyData.reduce(
                                      (s, r) => s + r.netRevenue,
                                      0,
                                    ),
                                  )}
                                </td>
                                <td>
                                  {dailyData.reduce(
                                    (s, r) => s + r.invoicesCount,
                                    0,
                                  )}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {dailyData.length === 0 && !loading && (
                  <div className="empty-state-modern">
                    <div className="empty-icon-wrapper">
                      <BsCalendarDay />
                    </div>
                    <h4>لا توجد بيانات</h4>
                    <p>لا توجد فواتير لهذا اليوم</p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== Branches Tab ==================== */}
            {activeTab === "branches" && (
              <div>
                <FilterBar variant="panel">
                  <FilterGroup label="الفترة" icon={BsCalendarDay}>
                    <select
                      className="form-control-custom"
                      value={bcPeriod}
                      onChange={(e) => setBcPeriod(e.target.value)}
                    >
                      {PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                  {bcPeriod === "custom" && (
                    <>
                      <FilterGroup label="من" icon={BsCalendarDay}>
                        <input
                          className="form-control-custom"
                          type="date"
                          value={bcDateFrom}
                          onChange={(e) => setBcDateFrom(e.target.value)}
                        />
                      </FilterGroup>
                      <FilterGroup label="إلى" icon={BsCalendarDay}>
                        <input
                          className="form-control-custom"
                          type="date"
                          value={bcDateTo}
                          onChange={(e) => setBcDateTo(e.target.value)}
                        />
                      </FilterGroup>
                    </>
                  )}
                  <FilterActions>
                    <button
                      className="btn-custom btn-custom-outline btn-custom-sm"
                      onClick={() =>
                        handleExportCSV(bcData, "مقارنة_الفروع", [
                          { label: "الفرع", value: (r) => r.branchName },
                          { label: "الإيراد", value: (r) => r.revenue },
                          { label: "المرتجعات", value: (r) => r.returns },
                          { label: "صافي", value: (r) => r.netRevenue },
                          { label: "COGS", value: (r) => r.cogs },
                          { label: "الربح", value: (r) => r.profit },
                          { label: "هامش%", value: (r) => r.profitMargin },
                          { label: "الفواتير", value: (r) => r.invoicesCount },
                        ])
                      }
                    >
                      <BsDownload /> CSV
                    </button>
                  </FilterActions>
                </FilterBar>

                {bcData.length > 0 && (
                  <>
                    <div className="kpi-bar">
                      <div className="kpi-item">
                        <div
                          className="kpi-accent-line"
                          style={{ background: "var(--color-info)" }}
                        />
                        <div className="kpi-overline">أعلى فرع إيراداً</div>
                        <div className="kpi-label">
                          {
                            bcData.reduce((a, b) =>
                              a.revenue > b.revenue ? a : b,
                            )?.branchName
                          }
                        </div>
                        <div
                          className="kpi-value"
                          style={{
                            color: "var(--color-info)",
                            fontSize: "var(--text-base)",
                          }}
                        >
                          {formatCurrency(
                            bcData.reduce((a, b) =>
                              a.revenue > b.revenue ? a : b,
                            )?.revenue,
                          )}
                        </div>
                      </div>
                      <div className="kpi-item">
                        <div
                          className="kpi-accent-line"
                          style={{ background: "var(--color-success)" }}
                        />
                        <div className="kpi-overline">أعلى فرع ربحاً</div>
                        <div className="kpi-label">
                          {
                            bcData.reduce((a, b) =>
                              a.profit > b.profit ? a : b,
                            )?.branchName
                          }
                        </div>
                        <div
                          className="kpi-value"
                          style={{
                            color: "var(--color-success)",
                            fontSize: "var(--text-base)",
                          }}
                        >
                          {formatCurrency(
                            bcData.reduce((a, b) =>
                              a.profit > b.profit ? a : b,
                            )?.profit,
                          )}
                        </div>
                      </div>
                      <div className="kpi-item">
                        <div
                          className="kpi-accent-line"
                          style={{ background: "var(--color-accent)" }}
                        />
                        <div className="kpi-overline">إجمالي الإيرادات</div>
                        <div
                          className="kpi-value"
                          style={{ color: "var(--color-accent)" }}
                        >
                          {formatCurrency(
                            bcData.reduce((s, r) => s + r.revenue, 0),
                          )}
                        </div>
                      </div>
                      <div className="kpi-item">
                        <div
                          className="kpi-accent-line"
                          style={{ background: "var(--color-success)" }}
                        />
                        <div className="kpi-overline">إجمالي الأرباح</div>
                        <div
                          className="kpi-value"
                          style={{ color: "var(--color-success)" }}
                        >
                          {formatCurrency(
                            bcData.reduce((s, r) => s + r.profit, 0),
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="card-premium">
                      <div className="card-header">
                        <h6>
                          <BsBuilding /> مقارنة أداء الفروع
                        </h6>
                      </div>
                      <div className="chart-wrapper">
                        <BranchComparison data={bcData} />
                      </div>
                    </div>

                    <div className="card-premium">
                      <div className="card-header">
                        <h6>
                          <BsFileEarmarkText /> تفاصيل المقارنة
                        </h6>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-container">
                          <table className="table-premium">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>الفرع</th>
                                <th>الإيراد</th>
                                <th>المرتجعات</th>
                                <th>صافي الإيراد</th>
                                <th>COGS</th>
                                <th>الربح</th>
                                <th>هامش %</th>
                                <th>الفواتير</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bcData.map((r, i) => (
                                <tr key={i}>
                                  <td>{renderRankBadge(i)}</td>
                                  <td style={{ fontWeight: 600 }}>
                                    {r.branchName}
                                  </td>
                                  <td className="mono">
                                    {formatCurrency(r.revenue)}
                                  </td>
                                  <td className="mono">
                                    {formatCurrency(r.returns)}
                                  </td>
                                  <td className="mono">
                                    {formatCurrency(r.netRevenue)}
                                  </td>
                                  <td className="mono">
                                    {formatCurrency(r.cogs)}
                                  </td>
                                  <td
                                    className="mono"
                                    style={{
                                      color:
                                        r.profit >= 0
                                          ? "var(--color-success)"
                                          : "var(--color-danger)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {formatCurrency(r.profit)}
                                  </td>
                                  <td>
                                    <span className="margin-bar">
                                      <span className="margin-track">
                                        <span className="margin-fill" style={{
                                          width: `${Math.min(Math.max(r.profitMargin || 0, 0), 100)}%`,
                                          background: (r.profitMargin || 0) >= 30 ? 'var(--color-success)' : (r.profitMargin || 0) >= 15 ? 'var(--color-warning)' : 'var(--color-danger)',
                                        }} />
                                      </span>
                                      <span className="mono">{r.profitMargin}%</span>
                                    </span>
                                  </td>
                                  <td>{r.invoicesCount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {bcData.length === 0 && !loading && (
                  <div className="empty-state-modern">
                    <div className="empty-icon-wrapper">
                      <BsBuilding />
                    </div>
                    <h4>لا توجد بيانات</h4>
                    <p>لا توجد فواتير في هذه الفترة</p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== Products Tab ==================== */}
            {activeTab === "products" && (
              <div>
                <FilterBar variant="panel">
                  <FilterGroup label="الفترة" icon={BsCalendarDay}>
                    <select
                      className="form-control-custom"
                      value={prodPeriod}
                      onChange={(e) => setProdPeriod(e.target.value)}
                    >
                      {PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                  {prodPeriod === "custom" && (
                    <>
                      <FilterGroup label="من" icon={BsCalendarDay}>
                        <input
                          className="form-control-custom"
                          type="date"
                          value={prodDateFrom}
                          onChange={(e) => setProdDateFrom(e.target.value)}
                        />
                      </FilterGroup>
                      <FilterGroup label="إلى" icon={BsCalendarDay}>
                        <input
                          className="form-control-custom"
                          type="date"
                          value={prodDateTo}
                          onChange={(e) => setProdDateTo(e.target.value)}
                        />
                      </FilterGroup>
                    </>
                  )}
                  <FilterGroup label="الفرع" icon={BsBuilding}>
                    <select
                      className="form-control-custom"
                      value={prodBranchId}
                      onChange={(e) => setProdBranchId(e.target.value)}
                    >
                      <option value="">كل الفروع</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                  <FilterGroup label="ترتيب حسب" icon={BsBox}>
                    <select
                      className="form-control-custom"
                      value={prodSortBy}
                      onChange={(e) => setProdSortBy(e.target.value)}
                    >
                      <option value="revenue">الإيراد</option>
                      <option value="quantity">الكمية</option>
                      <option value="profit">الربح</option>
                    </select>
                  </FilterGroup>
                  <FilterGroup label="عدد النتائج" icon={BsBox}>
                    <select
                      className="form-control-custom"
                      value={prodLimit}
                      onChange={(e) => setProdLimit(Number(e.target.value))}
                    >
                      <option value={10}>Top 10</option>
                      <option value={20}>Top 20</option>
                      <option value={50}>Top 50</option>
                      <option value={9999}>الكل</option>
                    </select>
                  </FilterGroup>
                </FilterBar>

                <div className="section-header">
                  <BsBox style={{ color: "var(--color-accent)" }} />
                  <h5>أعلى المنتجات مبيعاً</h5>
                  <span className="section-badge">{prodData.length} منتج</span>
                  <div className="section-line" />
                </div>

                {prodData.length > 0 && (
                  <>
                    <div className="grid-2" style={{ marginBottom: 20 }}>
                      <div className="card-premium" style={{ marginBottom: 0 }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                          <h6 style={{ margin: 0 }}>
                            <BsGraphUp /> ترتيب المنتجات (حسب الفلتر)
                          </h6>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              id="prod-metric-btn-revenue"
                              className={`btn-custom btn-custom-sm ${prodChartMetric === 'revenue' ? 'active' : 'btn-custom-outline'}`}
                              style={{ padding: '2px 8px', fontSize: 'var(--text-xs)' }}
                              onClick={() => setProdChartMetric('revenue')}
                            >الإيراد</button>
                            <button
                              id="prod-metric-btn-profit"
                              className={`btn-custom btn-custom-sm ${prodChartMetric === 'profit' ? 'active' : 'btn-custom-outline'}`}
                              style={{ padding: '2px 8px', fontSize: 'var(--text-xs)' }}
                              onClick={() => setProdChartMetric('profit')}
                            >الربح</button>
                          </div>
                        </div>
                        <div
                          className="card-body"
                          style={{ padding: "var(--space-3)" }}
                        >
                          <TopProductsChart data={prodData} metric={prodChartMetric} />
                        </div>
                      </div>
                      
                      <div className="card-premium" style={{ marginBottom: 0 }}>
                        <div className="card-header">
                          <h6>
                            <BsBox /> أعلى المنتجات مبيعاً بالكمية
                          </h6>
                        </div>
                        <div
                          className="card-body"
                          style={{ padding: "var(--space-3)" }}
                        >
                          <TopProductsChart data={prodData} metric="quantity" />
                        </div>
                      </div>
                    </div>

                    <div className="card-premium" id="products-detail-table-card">
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <h6 style={{ margin: 0 }}>
                          <BsFileEarmarkText /> تفاصيل المنتجات
                        </h6>
                        <div className="ledger-search-input" style={{ minWidth: 220, padding: '4px 10px' }}>
                          <BsSearch />
                          <input
                            id="product-search-bar"
                            type="text"
                            placeholder="بحث بالمنتج أو الباركود..."
                            value={prodSearchQuery}
                            onChange={(e) => setProdSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-container">
                          <table className="table-premium">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>المنتج</th>
                                <th>الباركود</th>
                                <th>الكمية المباعة</th>
                                <th>الإيراد</th>
                                <th>التكلفة</th>
                                <th>صافي الربح</th>
                                <th>هامش %</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredProdData.map((p, i) => (
                                <tr key={p.productId}>
                                  <td>{renderRankBadge(i)}</td>
                                  <td style={{ fontWeight: 600 }}>
                                    {p.productName}
                                  </td>
                                  <td
                                    style={{ color: "var(--color-text-muted)" }}
                                  >
                                    {p.barcode || "—"}
                                  </td>
                                  <td className="mono">{p.totalQuantity}</td>
                                  <td
                                    className="mono"
                                    style={{
                                      color: "var(--color-info)",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {formatCurrency(p.totalRevenue)}
                                  </td>
                                  <td className="mono">
                                    {formatCurrency(p.totalCost)}
                                  </td>
                                  <td
                                    className="mono"
                                    style={{
                                      color:
                                        p.totalProfit >= 0
                                          ? "var(--color-success)"
                                          : "var(--color-danger)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {formatCurrency(p.totalProfit)}
                                  </td>
                                  <td>
                                    <span className="margin-bar">
                                      <span className="margin-track">
                                        <span className="margin-fill" style={{
                                          width: `${Math.min(Math.max(p.profitMargin || 0, 0), 100)}%`,
                                          background: (p.profitMargin || 0) >= 30 ? 'var(--color-success)' : (p.profitMargin || 0) >= 15 ? 'var(--color-warning)' : 'var(--color-danger)',
                                        }} />
                                      </span>
                                      <span className="mono">{p.profitMargin}%</span>
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {prodData.length === 0 && !loading && (
                  <div className="empty-state-modern">
                    <div className="empty-icon-wrapper">
                      <BsBox />
                    </div>
                    <h4>لا توجد مبيعات</h4>
                    <p>لا توجد منتجات مبيعة في هذه الفترة</p>
                  </div>
                )}

                <div className="section-header" style={{ marginTop: 24 }}>
                  <BsBuilding style={{ color: "var(--color-warning)" }} />
                  <h5>المخزون الحالي</h5>
                  <span className="section-badge">{invData.length} منتج</span>
                  <div className="section-line" />
                </div>

                {invData.length > 0 && (
                  <div className="card-premium">
                    <div className="card-body p-0">
                      <div className="table-container">
                        <table className="table-premium">
                          <thead>
                            <tr>
                              <th>المنتج</th>
                              <th>الوحدة</th>
                              {branches.map((b) => (
                                <th key={b.id}>{b.name}</th>
                              ))}
                              <th>الإجمالي</th>
                              <th>متوسط التكلفة</th>
                              <th>قيمة المخزون</th>
                              <th>الحالة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invData.map((p) => (
                              <tr key={p.productId}>
                                <td style={{ fontWeight: 600 }}>
                                  {p.productName}
                                </td>
                                <td>{p.unit}</td>
                                {branches.map((b) => (
                                  <td
                                    key={b.id}
                                    className="mono"
                                    style={{ color: "var(--color-text-muted)" }}
                                  >
                                    {p.quantityPerBranch?.[b.name] || 0}
                                  </td>
                                ))}
                                <td className="mono">{p.totalQuantity}</td>
                                <td className="mono">
                                  {formatCurrency(p.averageCost)}
                                </td>
                                <td
                                  className="mono"
                                  style={{ fontWeight: 600 }}
                                >
                                  {formatCurrency(p.totalValue)}
                                </td>
                                <td>
                                  <span
                                    className={`badge-modern ${p.isLowStock ? "badge-red" : "badge-green"}`}
                                  >
                                    <span className="dot" />{" "}
                                    {p.isLowStock ? "منخفض" : "جيد"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== Deferred Tab ==================== */}
            {activeTab === "deferred" && (
              <div>
                <FilterBar variant="panel">
                  <FilterGroup label="الفترة (للتحصيلات)" icon={BsCalendarDay}>
                    <select
                      className="form-control-custom"
                      value={defPeriod}
                      onChange={(e) => setDefPeriod(e.target.value)}
                    >
                      <option value="month">هذا الشهر</option>
                      <option value="year">هذه السنة</option>
                      <option value="custom">مخصص</option>
                    </select>
                  </FilterGroup>
                  {defPeriod === "custom" && (
                    <>
                      <FilterGroup label="من" icon={BsCalendarDay}>
                        <input
                          className="form-control-custom"
                          type="date"
                          value={defDateFrom}
                          onChange={(e) => setDefDateFrom(e.target.value)}
                        />
                      </FilterGroup>
                      <FilterGroup label="إلى" icon={BsCalendarDay}>
                        <input
                          className="form-control-custom"
                          type="date"
                          value={defDateTo}
                          onChange={(e) => setDefDateTo(e.target.value)}
                        />
                      </FilterGroup>
                    </>
                  )}
                </FilterBar>

                {defAging && (
                  <>
                    <div className="kpi-bar">
                      <div className="kpi-item">
                        <div
                          className="kpi-accent-line"
                          style={{ background: "var(--color-danger)" }}
                        />
                        <div className="kpi-overline">إجمالي الديون</div>
                        <div
                          className="kpi-value"
                          style={{ color: "var(--color-danger)" }}
                        >
                          {formatCurrency(defAging.totalDeferred)}
                        </div>
                      </div>
                      <div className="kpi-item">
                        <div
                          className="kpi-accent-line"
                          style={{ background: "var(--color-info)" }}
                        />
                        <div className="kpi-overline">عدد العملاء بديون</div>
                        <div
                          className="kpi-value"
                          style={{ color: "var(--color-info)" }}
                        >
                          {defAging.clientsWithDebt}
                        </div>
                      </div>
                      <div className="kpi-item">
                        <div
                          className="kpi-accent-line"
                          style={{ background: "var(--color-warning)" }}
                        />
                        <div className="kpi-overline">أعلى عميل ديناً</div>
                        <div className="kpi-label">
                          {defAging.clients?.[0]?.clientName || "—"}
                        </div>
                        <div
                          className="kpi-value"
                          style={{
                            color: "var(--color-warning)",
                            fontSize: "var(--text-base)",
                          }}
                        >
                          {defAging.clients?.[0]
                            ? formatCurrency(defAging.clients[0].totalDebt)
                            : ""}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4) var(--space-5)',
                      marginBottom: 'var(--space-6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12
                    }} id="deferred-risk-status-panel">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BsExclamationTriangle style={{ color: 'var(--color-warning)', fontSize: '1.2rem' }} />
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>تقييم المخاطر الائتمانية للعملاء:</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span className="badge-modern badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px' }}>
                          <span className="dot" /> {riskSummary.critical} بمخاطر عالية (تجاوز الحد / متأخر +90)
                        </span>
                        <span className="badge-modern badge-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px' }}>
                          <span className="dot" /> {riskSummary.alert} بمخاطر متوسطة (متأخر +60 / استهلاك +75%)
                        </span>
                        <span className="badge-modern badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px' }}>
                          <span className="dot" /> {riskSummary.safe} بمخاطر منخفضة
                        </span>
                      </div>
                    </div>

                    {defAging.clients?.length > 0 && (
                      <div className="grid-2">
                        <div
                          className="card-premium"
                          style={{ marginBottom: 0 }}
                        >
                          <div className="card-header">
                            <h6>
                              <BsClock /> توزيع الأعمار للديون
                            </h6>
                          </div>
                          <div
                            className="card-body"
                            style={{ padding: "var(--space-3)" }}
                          >
                            <AgingStackChart clients={defAging.clients} />
                          </div>
                        </div>
                        <div
                          className="card-premium"
                          style={{ marginBottom: 0 }}
                        >
                          <div className="card-header">
                            <h6>
                              <BsExclamationTriangle /> توزيع المديونية
                            </h6>
                          </div>
                          <div
                            className="card-body"
                            style={{ padding: "var(--space-3)" }}
                          >
                            <ResponsiveContainer width="100%" height={260}>
                              <BarChart
                                data={(() => {
                                  const buckets = {
                                    "0-30 يوم": 0,
                                    "31-60 يوم": 0,
                                    "61-90 يوم": 0,
                                    "+90 يوم": 0,
                                  };
                                  defAging.clients.forEach((c) => {
                                    buckets["0-30 يوم"] += c.days0to30 || 0;
                                    buckets["31-60 يوم"] += c.days31to60 || 0;
                                    buckets["61-90 يوم"] += c.days61to90 || 0;
                                    buckets["+90 يوم"] += c.daysOver90 || 0;
                                  });
                                  return Object.entries(buckets).map(
                                    ([k, v]) => ({ name: k, value: v }),
                                  );
                                })()}
                                margin={{
                                  top: 5,
                                  right: 10,
                                  left: 10,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="var(--color-border-light)"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="name"
                                  tick={{
                                    fill: "var(--color-text-muted)",
                                    fontSize: 11,
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{
                                    fill: "var(--color-text-muted)",
                                    fontSize: 11,
                                  }}
                                  axisLine={false}
                                  tickLine={false}
                                />
                                <Tooltip content={<SingleBarTooltip />} />
                                <Bar
                                  dataKey="value"
                                  name="المديونية"
                                  radius={[4, 4, 0, 0]}
                                  maxBarSize={50}
                                >
                                  {[
                                    "#22C55E",
                                    "#FACC15",
                                    "#FB923C",
                                    "#EF4444",
                                  ].map((color, i) => (
                                    <Cell key={i} fill={color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="section-header">
                      <BsClock style={{ color: "var(--color-danger)" }} />
                      <h5>تحليل الأعمار (Aging Analysis)</h5>
                      <span className="section-badge">
                        {defAging.clients?.length || 0} عميل
                      </span>
                      <div className="section-line" />
                    </div>

                    {defAging.clients?.length > 0 && (
                      <div className="card-premium">
                        <div className="card-body p-0">
                          <div className="table-container">
                            <table className="table-premium">
                              <thead>
                                <tr>
                                  <th>العميل</th>
                                  <th>إجمالي الدين</th>
                                  <th>الحد الائتماني</th>
                                  <th>% الاستخدام</th>
                                  <th>0-30 يوم</th>
                                  <th>31-60 يوم</th>
                                  <th>61-90 يوم</th>
                                  <th>+90 يوم</th>
                                  <th>أقدم فاتورة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {defAging.clients.map((c) => (
                                  <tr key={c.clientId}>
                                    <td style={{ fontWeight: 600 }}>
                                      {c.clientName}
                                    </td>
                                    <td
                                      className="mono"
                                      style={{
                                        fontWeight: 700,
                                        color: "var(--color-danger)",
                                      }}
                                    >
                                      {formatCurrency(c.totalDebt)}
                                    </td>
                                    <td className="mono">
                                      {formatCurrency(c.creditLimit)}
                                    </td>
                                    <td style={{ minWidth: 140 }}>
                                      {renderProgressBar(
                                        c.creditUsagePercent,
                                        100,
                                      )}
                                    </td>
                                    <td className="mono">
                                      {formatCurrency(c.days0to30)}
                                    </td>
                                    <td className="mono">
                                      {formatCurrency(c.days31to60)}
                                    </td>
                                    <td className="mono">
                                      {formatCurrency(c.days61to90)}
                                    </td>
                                    <td
                                      className="mono"
                                      style={{
                                        color:
                                          c.daysOver90 > 0
                                            ? "var(--color-danger)"
                                            : "inherit",
                                        fontWeight:
                                          c.daysOver90 > 0 ? 700 : 400,
                                      }}
                                    >
                                      {formatCurrency(c.daysOver90)}
                                    </td>
                                    <td style={{ fontSize: "var(--text-sm)" }}>
                                      {c.oldestInvoiceDate
                                        ? formatDate(c.oldestInvoiceDate)
                                        : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="section-header" style={{ marginTop: 24 }}>
                      <BsCashStack style={{ color: "var(--color-success)" }} />
                      <h5>سجل تحصيل الآجل</h5>
                      <span className="section-badge">
                        {defCollections.length} عملية
                      </span>
                      <div className="section-line" />
                    </div>

                    <div
                      className={defCollections.length > 0 ? "grid-2" : ""}
                      style={{ marginBottom: "var(--space-5)" }}
                    >
                      {defCollections.length > 0 && (
                        <div
                          className="card-premium"
                          style={{ marginBottom: 0 }}
                        >
                          <div className="card-header">
                            <h6>
                              <BsGraphUp /> اتجاه التحصيلات
                            </h6>
                          </div>
                          <div
                            className="card-body"
                            style={{ padding: "var(--space-3)" }}
                          >
                            <CollectionsChart collections={defCollections} />
                          </div>
                        </div>
                      )}
                      <div className="card-premium" style={{ marginBottom: 0 }}>
                        <div className="card-header">
                          <h6>
                            <BsFileEarmarkText /> تفاصيل التحصيلات
                          </h6>
                        </div>
                        <div className="card-body p-0">
                          <div className="table-container">
                            <table className="table-premium">
                              <thead>
                                <tr>
                                  <th>التاريخ</th>
                                  <th>العميل</th>
                                  <th>الفرع</th>
                                  <th>المبلغ المحصّل</th>
                                  <th>طريقة الدفع</th>
                                </tr>
                              </thead>
                              <tbody>
                                {defCollections.map((c, i) => (
                                  <tr key={i}>
                                    <td>{formatDate(c.date)}</td>
                                    <td style={{ fontWeight: 600 }}>
                                      {c.clientName}
                                    </td>
                                    <td>{c.branchName}</td>
                                    <td
                                      className="mono"
                                      style={{
                                        color: "var(--color-success)",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {formatCurrency(c.amount)}
                                    </td>
                                    <td>
                                      {formatPaymentMethod(
                                        c.paymentMethod?.toLowerCase(),
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {defCollections.length === 0 && (
                                  <tr>
                                    <td colSpan={5}>
                                      <div
                                        className="empty-state-modern"
                                        style={{ padding: "24px 0" }}
                                      >
                                        <h4>لا توجد تحصيلات</h4>
                                        <p>لا توجد تحصيلات في هذه الفترة</p>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {!defAging && !loading && (
                  <div className="empty-state-modern">
                    <div className="empty-icon-wrapper">
                      <BsClock />
                    </div>
                    <h4>لا توجد بيانات آجل</h4>
                    <p>لم يتم العثور على أي ديون أو تحصيلات</p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== Salary Tab ==================== */}
            {activeTab === "salary" && (
              <div>
                <FilterBar variant="panel">
                  <FilterGroup label="الشهر" icon={BsCalendarDay}>
                    <select
                      className="form-control-custom"
                      value={salMonth}
                      onChange={(e) => setSalMonth(e.target.value)}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                  <FilterGroup label="السنة" icon={BsCalendarDay}>
                    <select
                      className="form-control-custom"
                      value={salYear}
                      onChange={(e) => setSalYear(e.target.value)}
                    >
                      {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                  <FilterGroup label="الفرع" icon={BsBuilding}>
                    <select
                      className="form-control-custom"
                      value={salBranchId}
                      onChange={(e) => setSalBranchId(e.target.value)}
                    >
                      <option value="">كل الفروع</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                  <FilterActions>
                    <button
                      className="btn-custom btn-custom-outline btn-custom-sm"
                      onClick={() =>
                        handleExportCSV(salData?.items || [], "الرواتب", [
                          { label: "الموظف", value: (r) => r.employeeName },
                          { label: "المبلغ", value: (r) => r.salaryAmount },
                          { label: "التاريخ", value: (r) => r.paidDate },
                        ])
                      }
                    >
                      <BsDownload /> CSV
                    </button>
                  </FilterActions>
                </FilterBar>

                {salData && (
                  <>
                    <div className="kpi-bar">
                      <div className="kpi-item">
                        <div
                          className="kpi-accent-line"
                          style={{ background: "var(--color-primary)" }}
                        />
                        <div className="kpi-overline">إجمالي الرواتب</div>
                        <div
                          className="kpi-value"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {formatCurrency(salData.totalSalaries)}
                        </div>
                      </div>
                      <div className="kpi-item">
                        <div
                          className="kpi-accent-line"
                          style={{ background: "var(--color-warning)" }}
                        />
                        <div className="kpi-overline">إجمالي السلف</div>
                        <div
                          className="kpi-value"
                          style={{ color: "var(--color-warning)" }}
                        >
                          {formatCurrency(salData.totalAdvances)}
                        </div>
                      </div>
                      <div className="kpi-item">
                        <div
                          className="kpi-accent-line"
                          style={{ background: "var(--color-info)" }}
                        />
                        <div className="kpi-overline">عدد الموظفين</div>
                        <div
                          className="kpi-value"
                          style={{ color: "var(--color-info)" }}
                        >
                          {salData.employeeCount}
                        </div>
                      </div>
                    </div>

                    {salData.items?.length > 0 && (
                      <div className="grid-2">
                        <div
                          className="card-premium"
                          style={{ marginBottom: 0 }}
                        >
                          <div className="card-header">
                            <h6>
                              <BsCashStack /> توزيع الرواتب
                            </h6>
                          </div>
                          <div
                            className="card-body"
                            style={{ padding: "var(--space-3)" }}
                          >
                            <SalaryChart items={salData.items} />
                          </div>
                        </div>
                        <div
                          className="card-premium"
                          style={{ marginBottom: 0 }}
                        >
                          <div className="card-header">
                            <h6>
                              <BsPeople /> ملخص الشهر
                            </h6>
                          </div>
                          <div
                            className="card-body"
                            style={{ padding: "var(--space-5)" }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 20,
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: "var(--text-xs)",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 500,
                                    marginBottom: 6,
                                  }}
                                >
                                  إجمالي الرواتب
                                </div>
                                <div
                                  style={{
                                    fontSize: "var(--text-2xl)",
                                    fontWeight: 700,
                                    fontFamily: "var(--font-numbers)",
                                    color: "var(--color-primary)",
                                  }}
                                >
                                  {formatCurrency(salData.totalSalaries)}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 24 }}>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "var(--text-xs)",
                                      color: "var(--color-text-muted)",
                                      fontWeight: 500,
                                      marginBottom: 4,
                                    }}
                                  >
                                    السلف
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "var(--text-lg)",
                                      fontWeight: 700,
                                      fontFamily: "var(--font-numbers)",
                                      color: "var(--color-warning)",
                                    }}
                                  >
                                    {formatCurrency(salData.totalAdvances)}
                                  </div>
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "var(--text-xs)",
                                      color: "var(--color-text-muted)",
                                      fontWeight: 500,
                                      marginBottom: 4,
                                    }}
                                  >
                                    الموظفين
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "var(--text-lg)",
                                      fontWeight: 700,
                                      fontFamily: "var(--font-numbers)",
                                      color: "var(--color-info)",
                                    }}
                                  >
                                    {salData.employeeCount}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: "var(--text-xs)",
                                    color: "var(--color-text-muted)",
                                    fontWeight: 500,
                                    marginBottom: 6,
                                  }}
                                >
                                  متوسط الراتب
                                </div>
                                <div
                                  style={{
                                    fontSize: "var(--text-lg)",
                                    fontWeight: 700,
                                    fontFamily: "var(--font-numbers)",
                                    color: "var(--color-accent)",
                                  }}
                                >
                                  {formatCurrency(
                                    salData.employeeCount > 0
                                      ? salData.totalSalaries /
                                          salData.employeeCount
                                      : 0,
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="card-premium">
                      <div className="card-header">
                        <h6>
                          <BsPeople /> تفاصيل الرواتب
                        </h6>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-container">
                          <table className="table-premium">
                            <thead>
                              <tr>
                                <th>الموظف</th>
                                <th>المبلغ</th>
                                <th>تاريخ الصرف</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salData.items?.map((s, i) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: 600 }}>
                                    {s.employeeName}
                                  </td>
                                  <td
                                    className="mono"
                                    style={{ fontWeight: 600 }}
                                  >
                                    {formatCurrency(s.salaryAmount)}
                                  </td>
                                  <td>{formatDate(s.paidDate)}</td>
                                </tr>
                              ))}
                              {(!salData.items ||
                                salData.items.length === 0) && (
                                <tr>
                                  <td colSpan={3}>
                                    <div
                                      className="empty-state-modern"
                                      style={{ padding: "24px 0" }}
                                    >
                                      <h4>لا توجد رواتب</h4>
                                      <p>لا توجد رواتب مدفوعة لهذا الشهر</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {!salData && !loading && (
                  <div className="empty-state-modern">
                    <div className="empty-icon-wrapper">
                      <BsCashStack />
                    </div>
                    <h4>لا توجد بيانات رواتب</h4>
                    <p>لم يتم العثور على رواتب لهذا الشهر</p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== Ledger Tab ==================== */}
            {activeTab === "ledger" && (
              <div>
                <FilterBar variant="panel">
                  <FilterGroup label="الفترة" icon={BsCalendarDay}>
                    <select
                      id="ledger-period-select"
                      className="form-control-custom"
                      value={ledPeriod}
                      onChange={(e) => setLedPeriod(e.target.value)}
                    >
                      {PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                  {ledPeriod === "custom" && (
                    <>
                      <FilterGroup label="من" icon={BsCalendarDay}>
                        <input
                          id="ledger-date-from"
                          className="form-control-custom"
                          type="date"
                          value={ledDateFrom}
                          onChange={(e) => setLedDateFrom(e.target.value)}
                        />
                      </FilterGroup>
                      <FilterGroup label="إلى" icon={BsCalendarDay}>
                        <input
                          id="ledger-date-to"
                          className="form-control-custom"
                          type="date"
                          value={ledDateTo}
                          onChange={(e) => setLedDateTo(e.target.value)}
                        />
                      </FilterGroup>
                    </>
                  )}
                  <FilterGroup label="الفرع" icon={BsBuilding}>
                    <select
                      id="ledger-branch-select"
                      className="form-control-custom"
                      value={ledBranchId}
                      onChange={(e) => setLedBranchId(e.target.value)}
                    >
                      <option value="">كل الفروع</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>
                  <FilterActions>
                    <button
                      id="ledger-export-csv-btn"
                      className="btn-custom btn-custom-outline btn-custom-sm"
                      onClick={() =>
                        handleExportCSV(ledData?.entries || [], "دفتر_الأستاذ", [
                          { label: "التاريخ", value: (r) => formatDate(r.date) },
                          { label: "الفرع", value: (r) => r.branchName || "—" },
                          { label: "النوع", value: (r) => r.type },
                          { label: "البيان", value: (r) => r.description },
                          { label: "طريقة الدفع", value: (r) => r.paymentMethod || "—" },
                          { label: "الوارد (+)", value: (r) => r.inAmount || 0 },
                          { label: "الصادر (-)", value: (r) => r.outAmount || 0 },
                          { label: "المرجع", value: (r) => r.referenceNumber || "—" },
                        ])
                      }
                    >
                      <BsDownload /> CSV
                    </button>
                  </FilterActions>
                </FilterBar>

                {ledData && (
                  <>
                    <div className="stats-grid-premium">
                      <div className="stat-card-premium var-success" id="ledger-kpi-total-in">
                        <div className="stat-icon"><BsArrowUp /></div>
                        <div className="stat-label">إجمالي الوارد (+)</div>
                        <div className="stat-number">{formatCurrency(ledData.totalIn)}</div>
                        <MiniSparkline data={ledgerSparklines.inData} strokeColor="#16A34A" />
                      </div>
                      <div className="stat-card-premium var-danger" id="ledger-kpi-total-out">
                        <div className="stat-icon"><BsArrowDown /></div>
                        <div className="stat-label">إجمالي الصادر (-)</div>
                        <div className="stat-number">{formatCurrency(ledData.totalOut)}</div>
                        <MiniSparkline data={ledgerSparklines.outData} strokeColor="#EF4444" />
                      </div>
                      <div className="stat-card-premium var-info" id="ledger-kpi-net">
                        <div className="stat-icon"><BsShieldCheck /></div>
                        <div className="stat-label">صافي حركة الخزينة</div>
                        <div className="stat-number" style={{ color: ledData.netAmount >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                          {formatCurrency(ledData.netAmount)}
                        </div>
                        <MiniSparkline data={ledgerSparklines.balData} strokeColor="#2563EB" />
                      </div>
                    </div>

                    <div className="card-premium" style={{ marginBottom: 20 }} id="ledger-flow-chart-card">
                      <div className="card-header">
                        <h6>
                          <BsGraphUp /> التدفقات المالية والرصيد المتراكم
                        </h6>
                      </div>
                      <div className="chart-wrapper">
                        <LedgerFlowChart entries={ledData.entries} />
                      </div>
                    </div>

                    <div className="card-premium" id="ledger-entries-table-card">
                      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <h6 style={{ margin: 0 }}>
                          <BsFileEarmarkText /> سجل قيود اليومية والعمليات المالية
                        </h6>
                        <div className="ledger-search-input" style={{ minWidth: 260, padding: '4px 12px' }}>
                          <BsSearch />
                          <input
                            id="ledger-search-bar"
                            type="text"
                            placeholder="بحث في البيان، الفرع، أو المرجع..."
                            value={ledSearchQuery}
                            onChange={(e) => setLedSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-container">
                          <table className="table-premium">
                            <thead>
                              <tr>
                                <th>التاريخ والوقت</th>
                                <th>الفرع</th>
                                <th>نوع العملية</th>
                                <th>البيان / الوصف</th>
                                <th>طريقة الدفع</th>
                                <th>الوارد (+)</th>
                                <th>الصادر (-)</th>
                                <th>الرقم المرجعي</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredLedgerEntries.map((e, idx) => {
                                const typeClass = e.type === "بيع" || e.type === "تحصيل آجل"
                                  ? "ledger-type-sale"
                                  : e.type === "مرتجع"
                                  ? "ledger-type-return"
                                  : e.type === "مشتريات" || e.type === "دفعات موردين"
                                  ? "ledger-type-purchase"
                                  : e.type === "مصروفات"
                                  ? "ledger-type-expense"
                                  : e.type === "رواتب"
                                  ? "ledger-type-salary"
                                  : "ledger-type-other";

                                return (
                                  <tr key={idx}>
                                    <td>{formatDate(e.date)}</td>
                                    <td style={{ fontWeight: 500 }}>{e.branchName || "—"}</td>
                                    <td>
                                      <span className={`ledger-type-badge ${typeClass}`}>
                                        {e.type}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{e.description}</td>
                                    <td>
                                      {e.paymentMethod 
                                        ? formatPaymentMethod(e.paymentMethod.toLowerCase()) 
                                        : "—"}
                                    </td>
                                    <td className="mono ledger-amount-in">
                                      {e.inAmount ? `+ ${formatCurrency(e.inAmount)}` : "—"}
                                    </td>
                                    <td className="mono ledger-amount-out">
                                      {e.outAmount ? `- ${formatCurrency(e.outAmount)}` : "—"}
                                    </td>
                                    <td style={{ color: "var(--color-text-muted)" }}>
                                      {e.referenceNumber || "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                              {filteredLedgerEntries.length === 0 && (
                                <tr>
                                  <td colSpan={8}>
                                    <div className="empty-state-modern" style={{ padding: "32px 0" }}>
                                      <h4>لا توجد قيود مالية</h4>
                                      <p>لم يتم العثور على أي عمليات تطابق خيارات البحث الحالية</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {!ledData && !loading && (
                  <div className="empty-state-modern">
                    <div className="empty-icon-wrapper">
                      <BsFileEarmarkText />
                    </div>
                    <h4>لا توجد بيانات حركة مالية</h4>
                    <p>برجاء تعديل الفلاتر أو مراجعة الاتصال بالخادم</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerReports;
