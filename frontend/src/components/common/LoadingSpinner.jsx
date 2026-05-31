const LoadingSpinner = ({ text = 'جاري التحميل...' }) => {
  return (
    <div className="loading-container" style={{ flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 5 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)', animation: 'pulse 1.2s ease infinite', animationDelay: '0s' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)', animation: 'pulse 1.2s ease infinite', animationDelay: '0.15s' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-accent)', animation: 'pulse 1.2s ease infinite', animationDelay: '0.3s' }} />
      </div>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>{text}</span>
    </div>
  );
};

export default LoadingSpinner;
