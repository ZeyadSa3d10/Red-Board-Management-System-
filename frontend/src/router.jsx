import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/common/RouteGuards';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/common/Layout';
import Login from './pages/Login';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import OwnerInventory from './pages/owner/OwnerInventory';
import OwnerSales from './pages/owner/OwnerSales';
import OwnerEmployees from './pages/owner/OwnerEmployees';
import OwnerReports from './pages/owner/OwnerReports';
import OwnerBranches from './pages/owner/OwnerBranches';
import OwnerProducts from './pages/owner/OwnerProducts';
import OwnerCustomers from './pages/owner/OwnerCustomers';
import OwnerSuppliers from './pages/owner/OwnerSuppliers';

import AccountantDashboard from './pages/accountant/AccountantDashboard';
import AccountantSuppliers from './pages/accountant/AccountantSuppliers';
import AccountantPurchases from './pages/accountant/AccountantPurchases';
import AccountantClients from './pages/accountant/AccountantClients';
import AccountantInventory from './pages/accountant/AccountantInventory';
import AccountantReports from './pages/accountant/AccountantReports';

import BranchDashboard from './pages/branch/BranchDashboard';
import BranchInvoices from './pages/branch/BranchInvoices';
import BranchInventory from './pages/branch/BranchInventory';
import BranchDailyRevenue from './pages/branch/BranchDailyRevenue';
import BranchDeferred from './pages/branch/BranchDeferred';
import BranchEmployees from './pages/branch/BranchEmployees';
import BranchTransfers from './pages/branch/BranchTransfers';
import BranchSupplyInstallation from './pages/branch/BranchSupplyInstallation';
import BranchReturns from './pages/branch/BranchReturns';
import BranchClients from './pages/branch/BranchClients';
import BranchExpenses from './pages/branch/BranchExpenses';
import Ledger from './pages/branch/Ledger';

import PosPage from './pages/pos/PosPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/owner" element={<ProtectedRoute allowedRoles={['owner']}><Layout role="owner" /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<OwnerDashboard />} />
                <Route path="inventory" element={<OwnerInventory />} />
                <Route path="sales" element={<OwnerSales />} />
                <Route path="employees" element={<OwnerEmployees />} />
                <Route path="reports" element={<OwnerReports />} />
                <Route path="branches" element={<OwnerBranches />} />
                <Route path="products" element={<OwnerProducts />} />
                <Route path="customers" element={<OwnerCustomers />} />
                <Route path="suppliers" element={<OwnerSuppliers />} />
                <Route path="ledger" element={<Ledger />} />
              </Route>

              <Route path="/accountant" element={<ProtectedRoute allowedRoles={['accountant', 'owner']}><Layout role="accountant" /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AccountantDashboard />} />
                <Route path="suppliers" element={<AccountantSuppliers />} />
                <Route path="purchases" element={<AccountantPurchases />} />
                <Route path="clients" element={<AccountantClients />} />
                <Route path="inventory" element={<AccountantInventory />} />
                <Route path="reports" element={<AccountantReports />} />
                <Route path="invoices" element={<BranchInvoices />} />
                <Route path="ledger" element={<Ledger />} />
              </Route>

              <Route path="/branch" element={<ProtectedRoute allowedRoles={['staff', 'accountant', 'owner']}><Layout role="branch" /></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<BranchDashboard />} />
                <Route path="invoices" element={<BranchInvoices />} />
                <Route path="inventory" element={<BranchInventory />} />
                <Route path="revenue" element={<BranchDailyRevenue />} />
                <Route path="deferred" element={<BranchDeferred />} />
                <Route path="transfers" element={<BranchTransfers />} />
                <Route path="supply-installation" element={<BranchSupplyInstallation />} />
                <Route path="returns" element={<BranchReturns />} />
                <Route path="clients" element={<BranchClients />} />
                <Route path="expenses" element={<BranchExpenses />} />
                <Route path="employees" element={<ProtectedRoute allowedRoles={['owner']}><BranchEmployees /></ProtectedRoute>} />
              </Route>

              <Route path="/pos" element={
                <ProtectedRoute allowedRoles={['owner', 'staff']}>
                  <Layout role="pos" />
                </ProtectedRoute>
              }>
                <Route index element={<PosPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            </ErrorBoundary>
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
