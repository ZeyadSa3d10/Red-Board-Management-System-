import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#DC2626', '#2563EB', '#D97706', '#16A34A', '#8B5CF6', '#EC4899', '#14B8A6'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{d.name}</div>
      <div className="chart-tooltip-row">
        الإيراد: <span className="chart-tooltip-value">{Number(d.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م</span>
      </div>
      <div className="chart-tooltip-row" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
        الحصة: <span style={{ fontWeight: 600 }}>{Number(d.payload.percent).toFixed(1)}%</span> من الإجمالي
      </div>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
  return (
    <text x={x} y={y} fill="var(--color-text-secondary)" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const BranchRevenueDonut = ({ dailyData = [] }) => {
  const total = dailyData.reduce((s, r) => s + Math.max(0, r.netRevenue), 0);
  
  const chartData = dailyData
    .map((r, i) => ({
      name: r.branchName,
      value: Math.max(0, r.netRevenue),
      color: COLORS[i % COLORS.length],
      percent: total > 0 ? (Math.max(0, r.netRevenue) / total) * 100 : 0
    }))
    .filter(d => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        لا توجد إيرادات إيجابية لتوزيعها اليوم
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300, position: 'relative' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={renderCustomLabel}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 8 }}
            formatter={(value) => <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)',
        textAlign: 'center', pointerEvents: 'none', width: 120
      }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>إيراد الفروع</div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-numbers)', color: 'var(--color-text-primary)', marginTop: 2 }}>
          {total.toLocaleString('en-US', { minimumFractionDigits: 0 })} ج.م
        </div>
      </div>
    </div>
  );
};

export default BranchRevenueDonut;
