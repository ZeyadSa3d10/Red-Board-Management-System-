import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip" style={{ minWidth: 180 }}>
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row" style={{ justifyContent: 'flex-start', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: p.name === 'الهامش %' ? '50%' : 2, background: p.color, flexShrink: 0 }} />
          <span>{p.name}:</span>
          <span className="chart-tooltip-value">
            {p.name === 'الهامش %' ? `${Number(p.value).toFixed(1)}%` : `${Number(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`}
          </span>
        </div>
      ))}
    </div>
  );
};

const BranchComparison = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 15, right: 10, left: 10, bottom: 5 }} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
        <XAxis dataKey="branchName" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 12 }}
          formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{value}</span>}
        />
        <Bar yAxisId="left" dataKey="revenue" fill="var(--color-primary)" fillOpacity={0.9} name="الإيرادات" radius={[4, 4, 0, 0]} maxBarSize={30} />
        <Bar yAxisId="left" dataKey="profit" fill="var(--color-info)" fillOpacity={0.9} name="الأرباح" radius={[4, 4, 0, 0]} maxBarSize={30} />
        <Line yAxisId="right" type="monotone" dataKey="profitMargin" stroke="var(--color-success)" strokeWidth={2.5} name="الهامش %" dot={{ r: 3, fill: 'var(--color-success)', stroke: 'white', strokeWidth: 1.5 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default BranchComparison;
