import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AGING_COLORS = ['#22C55E', '#FACC15', '#FB923C', '#EF4444'];
const AGING_KEYS = ['days0to30', 'days31to60', 'days61to90', 'daysOver90'];
const AGING_LABELS = ['0-30 يوم', '31-60 يوم', '61-90 يوم', '+90 يوم'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="chart-tooltip" style={{ minWidth: 200 }}>
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
      <div className="chart-tooltip-row" style={{ borderTop: '1px solid var(--color-border-light)', marginTop: 6, paddingTop: 6 }}>
        <span style={{ fontWeight: 700 }}>الإجمالي:</span>
        <span className="chart-tooltip-value">{total.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م</span>
      </div>
    </div>
  );
};

const AgingStackChart = ({ clients = [] }) => {
  if (!clients.length) return null;
  const data = clients.slice(0, 15).map(c => ({
    name: c.clientName?.length > 16 ? c.clientName.slice(0, 15) + '…' : c.clientName,
    days0to30: c.days0to30,
    days31to60: c.days31to60,
    days61to90: c.days61to90,
    daysOver90: c.daysOver90,
    fullName: c.clientName,
  })).reverse();

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 35 + 40)}>
      <BarChart data={data} layout="vertical" barSize={16} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={100} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(220,38,38,0.04)' }} />
        <Legend
          wrapperStyle={{ paddingTop: 8 }}
          formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500 }}>{value}</span>}
        />
        {AGING_KEYS.map((key, i) => (
          <Bar key={key} dataKey={key} stackId="a" fill={AGING_COLORS[i]} name={AGING_LABELS[i]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default AgingStackChart;
