import { BsTrophy, BsFillBoxFill, BsGraphUp, BsCurrencyDollar } from 'react-icons/bs';

const COLORS = ['#DC2626', '#2563EB', '#8B5CF6', '#D97706', '#16A34A', '#EC4899', '#14B8A6', '#F59E0B', '#6366F1', '#8B1A1A'];

const TopProductsChart = ({ data = [], metric = "revenue" }) => {
  if (!data.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
        لا توجد بيانات مبيعات للمنتجات
      </div>
    );
  }

  const items = data.slice(0, 10);
  
  // Decide value selector and formatter
  const getValue = (p) => {
    if (metric === "quantity") return p.totalQuantity || 0;
    if (metric === "profit") return p.totalProfit || 0;
    return p.totalRevenue || 0;
  };

  const formatVal = (v) => {
    if (metric === "quantity") {
      return `${Number(v).toLocaleString()} وحدة`;
    }
    return `${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })} ج.م`;
  };

  const getMetricIcon = () => {
    if (metric === "quantity") return <BsFillBoxFill />;
    if (metric === "profit") return <BsGraphUp />;
    return <BsCurrencyDollar />;
  };

  const maxValue = Math.max(...items.map(p => getValue(p)));

  return (
    <div className="top-products-list">
      {items.map((p, i) => {
        const val = getValue(p);
        const pct = maxValue > 0 ? (val / maxValue) * 100 : 0;
        
        return (
          <div key={p.productName || i} className="top-product-row">
            <div className="top-product-rank" style={{ background: COLORS[i % COLORS.length], color: '#fff' }}>
              {i === 0 ? <BsTrophy size={13} style={{ animation: 'trophyBounce 1s infinite alternate' }} /> : i + 1}
            </div>
            <div className="top-product-info">
              <div className="top-product-name">{p.productName}</div>
              <div className="top-product-bar-track">
                <div className="top-product-bar-fill" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
              </div>
            </div>
            <div className="top-product-value" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'inline-flex' }}>
                {getMetricIcon()}
              </span>
              <span>{formatVal(val)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopProductsChart;
