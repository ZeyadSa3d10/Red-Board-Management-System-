import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BsArrowRight, BsBuilding } from 'react-icons/bs';
import '../../styles/pos.css';

const PosLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (d) =>
    d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  const getBranchName = () => {
    if (user?.role === 'owner') return 'كل الفروع';
    return user?.branchName || user?.branchId || 'الفرع';
  };

  const getDefaultRoute = () => {
    if (user?.role === 'owner') return '/owner/dashboard';
    if (user?.role === 'accountant') return '/accountant/dashboard';
    return '/branch/dashboard';
  };

  return (
    <div className="pos-layout">
      <header className="pos-header">
        <div className="pos-header-left">
          <button className="pos-back-btn" onClick={() => navigate(getDefaultRoute())}>
            <BsArrowRight size={16} /> رجوع
          </button>
          <span className="pos-header-branch">
            <BsBuilding size={16} style={{ marginLeft: 6 }} />
            {getBranchName()}
          </span>
        </div>
        <div className="pos-header-center">
          <span className="pos-header-user">{user?.name || 'الكاشير'}</span>
        </div>
        <div className="pos-header-right">
          <span className="pos-header-clock">{formatTime(time)}</span>
        </div>
      </header>
      <div className="pos-body">
        <Outlet />
      </div>
    </div>
  );
};

export default PosLayout;
