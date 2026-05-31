import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip" style={{ minWidth: 200 }}>
      <div className="chart-tooltip-title">{d.fullDate}</div>
      <div className="chart-tooltip-row">
        <span>الوارد (+):</span>
        <span className="chart-tooltip-value" style={{ color: 'var(--color-success)' }}>
          {Number(d.in).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
        </span>
      </div>
      <div className="chart-tooltip-row">
        <span>الصادر (-):</span>
        <span className="chart-tooltip-value" style={{ color: 'var(--color-danger)' }}>
          {Number(d.out).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
        </span>
      </div>
      <div className="chart-tooltip-row" style={{ borderTop: '1px solid var(--color-border-light)', marginTop: 6, paddingTop: 6 }}>
        <span style={{ fontWeight: 700 }}>صافي الرصيد المتراكم:</span>
        <span className="chart-tooltip-value" style={{ color: 'var(--color-primary)' }}>
          {Number(d.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
        </span>
      </div>
    </div>
  );
};

const LedgerFlowChart = ({ entries = [] }) => {
  const chartData = useMemo(() => {
    if (!entries.length) return [];
    
    // Group entries by date
    const groups = {};
    entries.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date.endsWith('Z') ? e.date : e.date + 'Z').toLocaleDateString('en-CA');
      if (!groups[d]) {
        groups[d] = { date: d, in: 0, out: 0 };
      }
      groups[d].in += e.inAmount || 0;
      groups[d].out += e.outAmount || 0;
    });

    // Sort by date ascending
    const sorted = Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running cumulative balance
    let runningBalance = 0;
    return sorted.map(item => {
      runningBalance += (item.in - item.out);
      return {
        label: item.date.slice(5), // MM-DD for x-axis
        fullDate: item.date,
        in: item.in,
        out: item.out,
        balance: runningBalance
      };
    });
  }, [entries]);

  if (!chartData.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        لا توجد حركات مالية لعرض الرسم البياني
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'الوارد / الصادر (ج.م)', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 500 } }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: 'الرصيد المتراكم (ج.م)', angle: 90, position: 'insideRight', style: { fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 500 } }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 12 }}
          formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{value}</span>}
        />
        <Bar yAxisId="left" dataKey="in" fill="#16A34A" fillOpacity={0.85} name="الوارد (+)" radius={[3, 3, 0, 0]} maxBarSize={20} />
        <Bar yAxisId="left" dataKey="out" fill="#EF4444" fillOpacity={0.85} name="الصادر (-)" radius={[3, 3, 0, 0]} maxBarSize={20} />
        <Line yAxisId="right" type="monotone" dataKey="balance" stroke="var(--color-primary)" strokeWidth={2.5} name="الرصيد المتراكم" dot={{ r: 3, fill: 'var(--color-primary)', stroke: 'white', strokeWidth: 2 }} activeDot={{ r: 5 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default LedgerFlowChart;
