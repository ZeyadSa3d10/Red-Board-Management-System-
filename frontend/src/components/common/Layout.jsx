import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ToastNotifications from './ToastNotifications';
import GlobalToastListener from './GlobalToastListener';
import '../../styles/reports.css';
const Layout = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <TopBar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        <div className="page-container">
          <Outlet />
        </div>
      </div>
      <ToastNotifications />
      <GlobalToastListener />
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default Layout;
