import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#16A34A', '#2563EB', '#D97706', '#8B5CF6'];
const LABELS = ['نقدي', 'فودافون كاش', 'شيك', 'آجل'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-row" style={{ gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.payload.color }} />
        <span style={{ color: 'var(--color-text-secondary)' }}>{d.name}:</span>
        <span className="chart-tooltip-value">
          {Number(d.value).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
        </span>
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
        {d.payload.percent}% من الإجمالي
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

const PaymentPieChart = ({ cashAmount = 0, vodafoneCashAmount = 0, checkAmount = 0, deferredSales = 0 }) => {
  const total = cashAmount + vodafoneCashAmount + checkAmount + deferredSales;
  const data = [
    { name: LABELS[0], value: cashAmount, color: COLORS[0], percent: total > 0 ? ((cashAmount / total) * 100).toFixed(1) : 0 },
    { name: LABELS[1], value: vodafoneCashAmount, color: COLORS[1], percent: total > 0 ? ((vodafoneCashAmount / total) * 100).toFixed(1) : 0 },
    { name: LABELS[2], value: checkAmount, color: COLORS[2], percent: total > 0 ? ((checkAmount / total) * 100).toFixed(1) : 0 },
    { name: LABELS[3], value: deferredSales, color: COLORS[3], percent: total > 0 ? ((deferredSales / total) * 100).toFixed(1) : 0 },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        لا توجد مبيعات مسجلة لعرض التوزيع
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300, position: 'relative' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={105}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={renderCustomLabel}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, i) => (
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
        textAlign: 'center', pointerEvents: 'none', width: 130
      }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>إجمالي المبيعات</div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-numbers)', color: 'var(--color-text-primary)', marginTop: 2 }}>
          {total.toLocaleString('en-US', { minimumFractionDigits: 0 })} ج.م
        </div>
      </div>
    </div>
  );
};

export default PaymentPieChart;
