import { BsArrowUp, BsArrowDown } from 'react-icons/bs';

const colorMap = {
  primary: { bg: 'var(--color-accent-light)', text: 'var(--color-primary)', icon: 'var(--color-accent)' },
  success: { bg: 'var(--color-success-light)', text: 'var(--color-success)', icon: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)', icon: 'var(--color-warning)' },
  danger: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)', icon: 'var(--color-danger)' },
  info: { bg: 'var(--color-info-light)', text: 'var(--color-info)', icon: 'var(--color-info)' },
  accent: { bg: 'var(--color-accent-light)', text: 'var(--color-accent)', icon: 'var(--color-accent)' },
};

const StatCard = ({ title, value, prefix, suffix, change, icon: Icon, color = 'primary', loading }) => {
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="stat-card">
      {loading ? (
        <div className="loading-container" style={{ minHeight: 100 }}>
          <div className="spinner-border spinner-border-sm" role="status" />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div className="stat-card-icon" style={{ background: colors.bg }}>
              {Icon && <Icon size={22} color={colors.icon} />}
            </div>
            {change !== undefined && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                fontSize: 'var(--text-xs)', fontWeight: 600,
                color: change >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                background: change >= 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                padding: '2px 8px', borderRadius: 'var(--radius-full)',
              }}>
                {change >= 0 ? <BsArrowUp size={12} /> : <BsArrowDown size={12} />}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className="stat-card-label">{title}</div>
          <div className="stat-card-value" style={{ color: colors.text }}>
            {prefix}{typeof value === 'number' ? value.toLocaleString('en-US') : value}{suffix}
          </div>
        </>
      )}
    </div>
  );
};

export default StatCard;
