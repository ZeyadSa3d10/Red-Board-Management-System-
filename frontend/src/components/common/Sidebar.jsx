import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BsSpeedometer2, BsBoxes, BsGraphUp, BsPeople, BsBarChart, BsTruck, BsCartPlus, BsReceipt, BsCashCoin, BsClockHistory, BsDoorOpen, BsBuilding, BsPersonPlus, BsArrowLeftRight, BsGeoAlt, BsCart4, BsArrowReturnLeft, BsWallet2, BsBook, BsWrench } from 'react-icons/bs';

const ownerMenu = [
  { icon: BsSpeedometer2, label: 'الرئيسية', path: '/owner/dashboard' },
  { icon: BsCart4, label: 'نقطة البيع', path: '/pos' },
  { icon: BsBoxes, label: 'المخزون', path: '/owner/inventory' },
  { icon: BsGraphUp, label: 'المبيعات', path: '/owner/sales' },
  { icon: BsPeople, label: 'العملاء', path: '/owner/customers' },
  { icon: BsTruck, label: 'الموردون', path: '/owner/suppliers' },
  { icon: BsPersonPlus, label: 'المنتجات', path: '/owner/products' },
  { icon: BsPeople, label: 'الموظفون', path: '/owner/employees' },
  { icon: BsBarChart, label: 'التقارير', path: '/owner/reports' },
  { icon: BsGeoAlt, label: 'الفروع', path: '/owner/branches' },
  { icon: BsArrowReturnLeft, label: 'المرتجعات', path: '/branch/returns' },
  { icon: BsWrench, label: 'توريد و تركيب', path: '/branch/supply-installation' },
  { icon: BsWallet2, label: 'المصروفات', path: '/branch/expenses' },
  { icon: BsBook, label: 'دفتر الأستاذ', path: '/owner/ledger' },
];

const accountantMenu = [
  { icon: BsSpeedometer2, label: 'الرئيسية', path: '/accountant/dashboard' },
  { icon: BsPeople, label: 'العملاء', path: '/accountant/clients' },
  { icon: BsTruck, label: 'الموردون', path: '/accountant/suppliers' },
  { icon: BsCartPlus, label: 'المشتريات', path: '/accountant/purchases' },
  { icon: BsBoxes, label: 'المخزون', path: '/accountant/inventory' },
  { icon: BsReceipt, label: 'الفواتير', path: '/accountant/invoices' },
  { icon: BsWallet2, label: 'المصروفات', path: '/branch/expenses' },
  { icon: BsBook, label: 'دفتر الأستاذ', path: '/accountant/ledger' },
  { icon: BsBarChart, label: 'التقارير', path: '/accountant/reports' },
];

const branchMenu = [
  { icon: BsSpeedometer2, label: 'الرئيسية', path: '/branch/dashboard' },
  { icon: BsCart4, label: 'نقطة البيع', path: '/pos' },
  { icon: BsReceipt, label: 'الفواتير', path: '/branch/invoices' },
  { icon: BsBoxes, label: 'المخزون', path: '/branch/inventory' },
  { icon: BsCashCoin, label: 'إيراد اليوم', path: '/branch/revenue' },
  { icon: BsClockHistory, label: 'الآجل', path: '/branch/deferred' },
  { icon: BsArrowLeftRight, label: 'تحويل بضاعة', path: '/branch/transfers' },
  { icon: BsWrench, label: 'توريد و تركيب', path: '/branch/supply-installation' },
  { icon: BsArrowReturnLeft, label: 'المرتجعات', path: '/branch/returns' },
  { icon: BsPeople, label: 'العملاء', path: '/branch/clients' },
  { icon: BsWallet2, label: 'المصروفات', path: '/branch/expenses' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getMenu = () => {
    if (!user) return [];
    if (user.role === 'owner') return ownerMenu;
    if (user.role === 'accountant') return accountantMenu;
    return branchMenu;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`sidebar-wrapper ${isOpen ? 'open' : ''}`}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--color-border-light)' }}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ color: 'var(--color-accent)' }}><BsBuilding size={20} /></div>
          <div className="sidebar-logo-text">
            <h3>Red Board</h3>
            <p>نظام إدارة المؤسسة</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {getMenu().map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <item.icon size={17} className="sidebar-link-icon" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">
            <span className="sidebar-user-dot" />
            {user?.role === 'owner' ? 'المدير' : user?.role === 'accountant' ? 'محاسب' : 'موظف'}
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-logout-btn">
          <BsDoorOpen size={15} /> تسجيل خروج
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
