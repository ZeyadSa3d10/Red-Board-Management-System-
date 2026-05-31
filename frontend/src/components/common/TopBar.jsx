import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BsBell, BsSearch, BsX, BsCheckCircle, BsExclamationTriangle, BsInfoCircle, BsXCircle, BsList, BsBellSlash, BsTrash3 } from 'react-icons/bs';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../api/realApi';
import GlobalSearch from './GlobalSearch';

const iconMap = {
  success: BsCheckCircle,
  warning: BsExclamationTriangle,
  info: BsInfoCircle,
  danger: BsXCircle,
};

const roleLabel = { owner: 'المدير', accountant: 'محاسب', staff: 'موظف' };

const formatTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} ي`;
  return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
};

const TopBar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const { notifications, addNotification, removeNotification, clearNotifications } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const prevCount = useRef(notifications.length);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (notifications.length > prevCount.current) {
      setBadgePulse(true);
      const t = setTimeout(() => setBadgePulse(false), 350);
      prevCount.current = notifications.length;
      return () => clearTimeout(t);
    }
    prevCount.current = notifications.length;
  }, [notifications.length]);

  const lowStockFetched = useRef(false);

  useEffect(() => {
    if (!user || lowStockFetched.current) return;
    lowStockFetched.current = true;
    api.getLowStock().then(data => {
      let items = Array.isArray(data) ? data : (data?.$values || []);
      if (items.length === 0) return;
      const currentBranchId = user?.branchId;
      if (currentBranchId) items = items.filter(i => i.branchId === currentBranchId);
      if (items.length === 0) return;
      const grouped = {};
      items.forEach(i => {
        if (!grouped[i.productName]) grouped[i.productName] = { branches: [], alert: i.minStockAlert };
        grouped[i.productName].branches.push(`${i.branchName}: ${i.quantity}`);
      });
      Object.entries(grouped).forEach(([name, info]) => {
        const branchList = info.branches.join('، ');
        const msg = `${name}\nالمخزون: ${branchList}\nحد التنبيه: ${info.alert}`;
        addNotification(msg, 'warning', 0, `low-stock-${name}`);
      });
    }).catch(() => { });
  }, [user]);

  const initial = user?.name?.charAt(0) || '?';

  const handleClearAll = useCallback(() => {
    if (clearNotifications) clearNotifications();
  }, [clearNotifications]);

  return (
    <div className="topbar">
      <div className="topbar-accent" />

      <button onClick={onToggleSidebar} className="hamburger-btn topbar-hamburger">
        <BsList size={22} />
      </button>

      <div className="topbar-user">
        <div className="topbar-avatar topbar-avatar-accent">{initial}</div>
        <div className="topbar-user-info">
          <div className="topbar-user-name">{user?.name}</div>
          <div className="topbar-user-role">{roleLabel[user?.role] || ''}</div>
        </div>
      </div>

      <div className="topbar-divider" />

      <div ref={searchRef} className="topbar-search">
        <div className={`topbar-search-input ${searchFocused ? 'focused' : ''}`}>
          <BsSearch size={15} className="topbar-search-icon" />
          <input
            placeholder="ابحث عن منتج، عميل، فاتورة..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
          />
        </div>
        {searchFocused && <GlobalSearch query={searchQuery} />}
      </div>

      <div className="topbar-spacer" />

      <div ref={notifRef} className="topbar-actions">
        <button
          onClick={() => setShowNotifications(prev => !prev)}
          className={`notif-btn${notifications.length > 0 ? ' has-unread' : ''}${showNotifications ? ' active' : ''}`}
        >
          <BsBell size={18} />
          {notifications.length > 0 && (
            <span className={`notif-badge${badgePulse ? ' pulse-once' : ''}`}>
              {Math.min(notifications.length, 99)}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <div className="notif-header-title">
                <BsBell size={16} />
                الإشعارات
                <span className="notif-header-count">{notifications.length}</span>
              </div>
              {notifications.length > 0 && (
                <div className="notif-header-actions">
                  <button className="notif-clear-btn" onClick={handleClearAll}>
                    <BsTrash3 size={12} />
                    مسح الكل
                  </button>
                </div>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon"><BsBellSlash /></div>
                <div className="notif-empty-text">لا توجد إشعارات</div>
                <div className="notif-empty-sub">ستظهر هنا إشعارات النظام والتنبيهات</div>
              </div>
            ) : (
              <div className="notif-list">
                {notifications.map(n => {
                  const Icon = iconMap[n.type] || iconMap.info;
                  const iconClass = `notif-item-icon-${n.type || 'info'}`;
                  return (
                    <div key={n.id} className="notif-item">
                      <div className={`notif-item-icon ${iconClass}`}><Icon size={16} /></div>
                      <div className="notif-item-content">
                        <div className="notif-item-message">{n.message}</div>
                        <div className="notif-item-time">
                          <span className="notif-item-dot" />
                          {n.time ? formatTime(new Date(n.time)) : 'الآن'}
                        </div>
                      </div>
                      <button onClick={() => removeNotification(n.id)} className="notif-item-dismiss" title="إزالة">
                        <BsX size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="topbar-divider" />


      </div>
    </div>
  );
};

export default TopBar;
