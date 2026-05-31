import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      <div className="chart-tooltip-row">
        التحصيلات: <span className="chart-tooltip-value" style={{ color: 'var(--color-success)' }}>
          {payload[0]?.value?.toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م
        </span>
      </div>
      {payload[0]?.payload?.count !== undefined && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
          عدد العمليات: {payload[0].payload.count}
        </div>
      )}
    </div>
  );
};

const CollectionsChart = ({ collections = [] }) => {
  const [chartView] = useState('day');

  const chartData = useMemo(() => {
    if (!collections.length) return [];
    if (chartView === 'day') {
      const grouped = {};
      collections.forEach(c => {
        const d = c.date ? new Date(c.date.endsWith('Z') ? c.date : c.date + 'Z').toLocaleDateString('en-CA') : 'unknown';
        grouped[d] = (grouped[d] || 0) + c.amount;
      });
      return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount], i) => ({
        label: date?.slice(5) || `#${i + 1}`,
        value: amount,
        count: collections.filter(c => (c.date ? new Date(c.date.endsWith('Z') ? c.date : c.date + 'Z').toLocaleDateString('en-CA') : 'unknown') === date).length,
      }));
    }
    return [];
  }, [collections, chartView]);

  if (!chartData.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        لا توجد تحصيلات مسجلة في هذه الفترة لعرض الرسم البياني
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.16}/>
              <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="value" stroke="var(--color-success)" strokeWidth={2.5} fill="url(#colorCollections)" name="التحصيلات" dot={{ r: 3, fill: 'var(--color-success)', stroke: 'white', strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CollectionsChart;
