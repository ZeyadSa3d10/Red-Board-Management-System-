import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#DC2626', '#2563EB', '#8B5CF6', '#D97706', '#16A34A', '#EC4899', '#14B8A6', '#8B1A1A'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      <div className="chart-tooltip-row">
        الراتب: <span className="chart-tooltip-value">{Number(d.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م</span>
      </div>
    </div>
  );
};

const SalaryChart = ({ items = [] }) => {
  if (!items.length) return null;
  const chartData = items
    .sort((a, b) => b.salaryAmount - a.salaryAmount)
    .slice(0, 15)
    .map(s => ({
      name: s.employeeName?.length > 18 ? s.employeeName.slice(0, 17) + '…' : s.employeeName,
      value: s.salaryAmount,
      fullName: s.employeeName,
      date: s.paidDate,
    }))
    .reverse();

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 35 + 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" horizontal={false} />
        <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={110} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(220,38,38,0.04)' }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20} animationDuration={800} animationEasing="ease-out">
          {chartData.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SalaryChart;
