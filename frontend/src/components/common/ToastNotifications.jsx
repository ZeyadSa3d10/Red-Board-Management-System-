import { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { BsX, BsCheckCircle, BsExclamationTriangle, BsInfoCircle, BsXCircle } from 'react-icons/bs';

const iconMap = {
  success: BsCheckCircle,
  warning: BsExclamationTriangle,
  info: BsInfoCircle,
  danger: BsXCircle,
};

const themeMap = {
  success: { bg: '#16A34A', label: 'تم بنجاح' },
  warning: { bg: '#D97706', label: 'تنبيه' },
  info: { bg: '#2563EB', label: 'معلومات' },
  danger: { bg: '#DC2626', label: 'خطأ' },
};

const ToastItem = ({ n, onRemove }) => {
  const [progress, setProgress] = useState(100);
  const theme = themeMap[n.type] || themeMap.info;
  const Icon = iconMap[n.type] || iconMap.info;
  const duration = 4000;

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [duration]);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 0,
        display: 'flex',
        alignItems: 'stretch',
        minWidth: 340,
        maxWidth: 420,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        pointerEvents: 'auto',
        overflow: 'hidden',
        animation: 'toastSlideIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)',
        direction: 'rtl',
      }}
    >
      <div
        style={{
          width: 48,
          minHeight: '100%',
          background: theme.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={22} color="#fff" />
      </div>

      <div style={{ flex: 1, padding: '14px 14px 10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.bg, letterSpacing: 0.5 }}>
            {theme.label}
          </span>
          <button
            onClick={() => onRemove(n.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.4,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'transparent'; }}
          >
            <BsX size={18} color="#374151" />
          </button>
        </div>
        <span style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5, fontWeight: 500 }}>
          {n.message}
        </span>
        <div
          style={{
            width: '100%',
            height: 3,
            background: '#E5E7EB',
            borderRadius: 2,
            marginTop: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: theme.bg,
              borderRadius: 2,
              transition: 'width 0.1s linear',
              opacity: 0.6,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const ToastNotifications = () => {
  const { notifications, removeNotification } = useNotifications();

  const toastNotifications = notifications.filter(n => !n.key?.startsWith('low-stock-'));

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(60px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: 80,
          right: 24,
          zIndex: 3000,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toastNotifications.map(n => (
          <ToastItem key={n.id} n={n} onRemove={removeNotification} />
        ))}
      </div>
    </>
  );
};

export default ToastNotifications;