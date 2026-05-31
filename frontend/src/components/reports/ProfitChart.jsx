import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BsGraphUp } from 'react-icons/bs';

const PnlTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
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

const ProfitChart = ({ data }) => {
  return (
    <div className="card card-premium" style={{ padding: 'var(--space-4)' }}>
      <div className="card-header" style={{ padding: '0 0 var(--space-3) 0' }}>
        <h6><BsGraphUp /> تحليل الأرباح</h6>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
          <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
          <Tooltip content={<PnlTooltip />} />
          <Legend />
          <Bar dataKey="revenue" fill="var(--color-primary)" name="الإيرادات" radius={[4, 4, 0, 0]} />
          <Bar dataKey="profit" fill="var(--color-accent)" name="الأرباح" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfitChart;
