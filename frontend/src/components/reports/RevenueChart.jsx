import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row" style={{ justifyContent: 'flex-start', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span>{p.name}:</span>
          <span className="chart-tooltip-value">
            {Number(p.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
          </span>
        </div>
      ))}
    </div>
  );
};

const RevenueChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.16}/>
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.16}/>
            <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
        <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 12 }}
          formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{value}</span>}
        />
        <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#colorRevenue)" name="الإيرادات" dot={{ r: 3, fill: 'var(--color-primary)', stroke: 'white', strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
        <Area type="monotone" dataKey="profit" stroke="var(--color-success)" strokeWidth={2.5} fill="url(#colorProfit)" name="الأرباح" dot={{ r: 3, fill: 'var(--color-success)', stroke: 'white', strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
