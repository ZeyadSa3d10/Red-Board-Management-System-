import { http, httpPublic } from './client';
import { getToday } from '../utils/formatters';

const roleMap = {
  Owner: 'owner',
  Accountant: 'accountant',
  Staff: 'staff',
};

const invTypeToBackend = {
  sale: 1, sale_deferred: 2,   return_sale: 3,
  return_deferred: 4, supply_installation: 5, return_supply_installation: 6, transfer: 7, deferred_payment: 8,
};

const invTypeFromBackend = {
  1: 'sale', 2: 'sale_deferred', 3: 'return_sale',
  4: 'return_deferred', 5: 'supply_installation', 6: 'return_supply_installation', 7: 'transfer', 8: 'deferred_payment',
  'Sale': 'sale', 'SaleDeferred': 'sale_deferred', 'ReturnSale': 'return_sale',
  'ReturnDeferred': 'return_deferred', 'SupplyAndInstallation': 'supply_installation', 'ReturnSupplyAndInstallation': 'return_supply_installation', 'Transfer': 'transfer', 'DeferredPayment': 'deferred_payment',
};

const payMethodToBackend = {
  cash: 'Cash', vodafone_cash: 'VodafoneCash', check: 'Check', bank_transfer: 'BankTransfer',
};

const payMethodFromBackend = {
  1: 'cash', 2: 'vodafone_cash', 3: 'check', 4: 'bank_transfer',
  'Cash': 'cash', 'VodafoneCash': 'vodafone_cash', 'Check': 'check', 'BankTransfer': 'bank_transfer',
};

export const INVOICE_TYPES = {
  SALE: 'sale', SALE_DEFERRED: 'sale_deferred', RETURN_SALE: 'return_sale',
  RETURN_DEFERRED: 'return_deferred', RETURN_SUPPLY_INSTALLATION: 'return_supply_installation', SUPPLY_INSTALLATION: 'supply_installation', TRANSFER: 'transfer', DEFERRED_PAYMENT: 'deferred_payment',
};

export const PAYMENT_METHODS = {
  CASH: 'cash', VODAFONE_CASH: 'vodafone_cash', CHECK: 'check', BANK_TRANSFER: 'bank_transfer',
};

export const roleLabels = {
  owner: 'المدير', accountant: 'محاسب',
  staff: 'موظف',
};

export const categories = [];

const mapUser = (dto) => ({
  id: dto.employeeId,
  name: dto.fullName,
  fullName: dto.fullName,
  role: roleMap[dto.role] || dto.role?.toLowerCase(),
  branchId: dto.branchId,
  branchName: dto.branchName,
  phone: dto.phone || '',
  nationalId: dto.nationalId || '',
});

export const logoutApi = async () => {
  try { await http.post('/Auth/logout'); } catch { /* ignore */ }
};

export const api = {
  login: async (phone, password) => {
    try {
      const data = await httpPublic.post('/Auth/login', { phone, password });
      return {
        success: true,
        user: mapUser(data),
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  getBranches: async () => http.get('/Branch'),
  getBranchById: async (id) => http.get(`/Branch/${id}`),
  addBranch: async (data) => http.post('/Branch', data),

  getClients: async () => http.get('/Client'),
  addClient: async (data) => http.post('/Client', {
    name: data.name,
    phone: data.phone || null,
    address: data.address || null,
    isCompany: data.isCompany || false,
    creditLimit: Number(data.creditLimit) || 0,
  }),

  getTransfers: async () => http.get('/Transfer'),

  getProducts: async () => http.get('/Product'),
  getCategories: async () => http.get('/Product/categories').catch(() => []),
  addProduct: async (data) => http.post('/Product', {
    name: data.name,
    barcode: data.barcode || null,
    unit: data.unit,
    purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : null,
    minSalePrice: Number(data.minSalePrice),
    currentSalePrice: Number(data.currentSalePrice),
    minStockAlert: Number(data.minStockAlert) || 10,
    categoryId: Number(data.categoryId),
    initialQuantities: (data.initialQuantities || []).map(iq => ({
      branchId: iq.branchId,
      quantity: Number(iq.quantity) || 0,
      averageCost: Number(iq.averageCost) || 0
    })),
  }),

  updateProduct: async (id, data) => http.put(`/Product/${id}`, {
    name: data.name,
    barcode: data.barcode || null,
    unit: data.unit,
    purchasePrice: data.purchasePrice !== '' && data.purchasePrice != null ? Number(data.purchasePrice) : null,
    minSalePrice: Number(data.minSalePrice),
    currentSalePrice: Number(data.currentSalePrice),
    minStockAlert: Number(data.minStockAlert) || 10,
    categoryId: Number(data.categoryId),
    initialQuantities: (data.initialQuantities || []).map(iq => ({
      branchId: iq.branchId,
      quantity: Number(iq.quantity) || 0,
      averageCost: Number(iq.averageCost) || 0
    })),
  }),

  deleteProduct: async (id) => http.delete(`/Product/${id}`),

  getProductsByBranch: async (branchId) => {
    const [products, inventory] = await Promise.all([
      http.get(`/Product/by-branch/${branchId}`),
      http.get(`/Inventory/branch/${branchId}`).catch(() => []),
    ]);

    const invMap = {};
    inventory.forEach(i => {
      if (!invMap[i.productId]) invMap[i.productId] = [];
      invMap[i.productId].push(i);
    });

    return products.map(p => ({
      ...p,
      branchStocks: invMap[p.id] || [],
      totalQty: (invMap[p.id] || []).reduce((sum, b) => sum + b.quantity, 0),
      totalValue: (invMap[p.id] || []).reduce((sum, b) => sum + (b.quantity * b.averageCost), 0)
    }));
  },

  getAllStock: async () => {
    const [products, inventory] = await Promise.all([
      http.get('/Product'),
      http.get('/Inventory/stock').catch(() => []),
    ]);
    const invMap = {};
    inventory.forEach(i => {
      if (!invMap[i.productId]) invMap[i.productId] = [];
      invMap[i.productId].push(i);
    });
    return products.map(p => ({
      ...p,
      branchStocks: invMap[p.id] || [],
      totalQty: (invMap[p.id] || []).reduce((s, i) => s + i.quantity, 0),
      totalValue: (invMap[p.id] || []).reduce((s, i) => s + (i.quantity * i.averageCost), 0),
      isLowStock: (invMap[p.id] || []).reduce((s, i) => s + i.quantity, 0) <= (p.minStockAlert || 0),
    }));
  },

  getLowStock: async () => http.get('/Inventory/low-stock').catch(() => []),

  getInvoices: async (filters = {}) => {
    const params = {};
    if (filters.branchId) params.branchId = filters.branchId;
    if (filters.type) params.type = invTypeToBackend[filters.type];
    if (filters.date) params.dateFrom = filters.date;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.clientId) params.clientId = filters.clientId;
    if (filters.relatedInvoiceId) params.relatedInvoiceId = filters.relatedInvoiceId;
    if (filters.page) params.page = filters.page;
    if (filters.pageSize) params.pageSize = filters.pageSize;
    const data = await http.get('/Invoice', params);
    if (data?.items) {
      const mapped = data.items.map(mapInvoice);
      mapped.totalCount = data.totalCount;
      mapped.totalPages = data.totalPages;
      mapped.currentPage = data.pageNumber || data.page || 1;
      mapped.pageSize = data.pageSize;
      return mapped;
    }
    const items = data || [];
    const result = items.map(mapInvoice);
    result.totalCount = items.length;
    result.totalPages = 1;
    result.currentPage = 1;
    result.pageSize = items.length;
    return result;
  },

  getInvoiceById: async (id) => {
    const data = await http.get(`/Invoice/${id}`);
    return mapInvoice(data);
  },

  getInvoiceByNumber: async (invoiceNumber) => {
    const data = await http.get(`/Invoice/by-number/${encodeURIComponent(invoiceNumber)}`);
    return mapInvoice(data);
  },

  createInvoice: async (data) => {
    const type = data.type;
    if (type === INVOICE_TYPES.SALE) {
      const body = {
        branchId: Number(data.branchId),
        clientId: data.clientId ? Number(data.clientId) : null,
        walkInClientName: data.clientName || null,
        items: data.items.map(i => ({
          productId: Number(i.productId),
          quantity: Number(i.qty),
          unitPrice: Number(i.unitPrice ?? 0),
        })),
        discount: Number(data.discount || 0),
        transportCost: Number(data.transportCost || 0),
        paymentMethod: payMethodToBackend[data.paymentMethod] || 1,
        paymentReference: data.paymentReference || null,
        notes: data.notes || '',
      };
      const result = await http.post('/Invoice/sale', body);
      return mapInvoice(result);
    }
    if (type === INVOICE_TYPES.SALE_DEFERRED) {
      const body = {
        branchId: Number(data.branchId),
        clientId: Number(data.clientId),
        items: data.items.map(i => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity || i.qty),
          unitPrice: Number(i.unitPrice ?? 0),
        })),
        discount: Number(data.discount || 0),
        transportCost: Number(data.transportCost || 0),
        dueDate: data.deferredDueDate || null,
        notes: data.notes || '',
      };
      const result = await http.post('/Invoice/deferred', body);
      return mapInvoice(result);
    }
    if (type === INVOICE_TYPES.RETURN_SALE || type === INVOICE_TYPES.RETURN_DEFERRED || type === INVOICE_TYPES.RETURN_SUPPLY_INSTALLATION) {
      const body = {
        branchId: Number(data.branchId),
        relatedInvoiceId: Number(data.relatedInvoiceId),
        items: data.items.map(i => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity || i.qty),
        })),
        paymentMethod: data.paymentMethod ? payMethodToBackend[data.paymentMethod] : null,
        paymentReference: data.paymentReference || null,
        returnReason: data.returnReason || null,
        notes: data.notes || '',
      };
      const result = await http.post('/Invoice/return', body);
      return mapInvoice(result);
    }
    if (type === INVOICE_TYPES.SUPPLY_INSTALLATION) {
      const body = {
        branchId: Number(data.branchId),
        projectName: data.projectName,
        items: data.items.map(i => ({
          productId: Number(i.productId),
          quantity: Number(i.qty),
        })),
        notes: data.notes || '',
      };
      const result = await http.post('/Invoice/supply-installation', body);
      return mapInvoice(result);
    }
    throw new Error(`نوع الفاتورة غير مدعوم: ${type}`);
  },

  getDailyRevenue: async (branchId, date) => {
    const data = await http.get('/Invoice/daily-revenue', { branchId, date });
    return {
      totalSales: data.totalSales || 0,
      totalReturns: data.totalReturns || 0,
      deferredPayments: data.deferredPayments || 0,
      netRevenue: data.netRevenue || 0,
      invoicesCount: data.invoicesCount || 0,
      cash: data.cashAmount || 0,
      vodafoneCash: data.vodafoneCashAmount || 0,
      check: data.checkAmount || 0,
      bankTransfer: data.bankTransferAmount || 0,
    };
  },

  createClient: async (data) => http.post('/Client', data),
  getClientDeferred: async (clientId) => {
    const data = await api.getInvoices({ type: 'sale_deferred', clientId });
    return Array.isArray(data) ? data.filter(inv => inv.remainingAmount > 0) : [];
  },

  getClientPayments: async (clientId, branchId) => {
    const params = branchId ? { branchId } : {};
    return http.get(`/Client/${clientId}/payments`, params);
  },

  addClientPayment: async (clientId, paymentData) => {
    const body = {
      deferredInvoiceId: paymentData.deferredInvoiceId,
      amount: paymentData.amount,
      paymentMethod: payMethodToBackend[paymentData.paymentMethod] || 1,
      paymentDate: paymentData.date || getToday(),
      checkNumber: paymentData.checkNumber || null,
      notes: paymentData.notes || '',
    };
    return http.post(`/Client/${clientId}/payment`, body);
  },

  getSuppliers: async () => http.get('/Supplier'),
  getSupplierById: async (id) => http.get(`/Supplier/${id}`),

  getPurchaseInvoices: async (params = {}) => {
    const queryParams = {};
    if (params.branchId) queryParams.branchId = params.branchId;
    const data = await http.get('/Purchase', queryParams).catch(() => []);
    return (Array.isArray(data) ? data : (data?.data || [])).map(mapPurchaseInvoice);
  },

  getSupplierPayments: async () => http.get('/Supplier/payments').catch(() => []),

  addPurchaseInvoice: async (data) => {
    const body = {
      supplierId: data.supplierId,
      branchId: data.branchId,
      invoiceDate: data.date || getToday(),
      totalAmount: data.totalAmount,
      transportCost: Number(data.transportCost || 0),
      paidNow: data.paidAmount || 0,
      paymentMethod: payMethodToBackend[data.paymentMethod],
      projectName: data.projectName || null,
      notes: data.notes || '',
      items: data.items.map(i => ({
        productId: i.productId,
        quantity: i.qty,
        unitCost: i.unitCost,
      })),
    };
    const result = await http.post('/Purchase', body);
    return mapPurchaseInvoice(result);
  },

  addSupplierPayment: async (supplierId, paymentData) => {
    const body = {
      amount: paymentData.amount,
      paymentMethod: payMethodToBackend[paymentData.paymentMethod] || 1,
      paymentDate: paymentData.date || getToday(),
      checkNumber: paymentData.checkNumber || null,
      notes: paymentData.notes || '',
    };
    return http.post(`/Supplier/${supplierId}/payment`, body);
  },

  getExpenses: async (filters = {}) => {
    const params = {};
    if (filters.branchId) params.branchId = filters.branchId;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    return http.get('/Expense', params);
  },

  addExpense: async (data) => {
    return http.post('/Expense', {
      branchId: Number(data.branchId),
      description: data.description,
      amount: Number(data.amount),
      expenseDate: data.expenseDate || getToday(),
      notes: data.notes || '',
    });
  },

  deleteExpense: async (id) => http.delete(`/Expense/${id}`),

  getEmployees: async () => http.get('/Employee'),
  getEmployeesByBranch: async (branchId) => {
    return http.get(`/Employee/branch/${branchId}`);
  },

  addEmployee: async (data) => {
    const roleMap = { owner: 'Owner', accountant: 'Accountant', staff: 'Staff' };
    return http.post('/Employee', {
      fullName: data.name || data.fullName,
      phone: data.phone,
      password: data.password,
      nationalId: data.nationalId || '',
      role: roleMap[data.role] || data.role,
      salary: data.salary ? Number(data.salary) : null,
      branchId: data.branchId ? Number(data.branchId) : null,
      joinDate: data.joinDate || getToday(),
    });
  },
  updateEmployee: async (id, data) => {
    await http.put(`/Employee/${id}`, data);
    return { ...data, id };
  },

  toggleEmployeeActive: async (employeeId) => http.put(`/Employee/${employeeId}/toggle-active`),
  deleteEmployee: async (employeeId) => http.delete(`/Employee/${employeeId}`),

  resetEmployeePassword: async (employeeId, newPassword) => {
    return http.post(`/Employee/${employeeId}/reset-password`, { newPassword });
  },

  paySalary: async (employeeId, month, amount) => {
    const [year, m] = month.split('-').map(Number);
    return http.post(`/Employee/${employeeId}/salary`, {
      employeeId,
      month: m,
      year: year || new Date().getFullYear(),
      amount,
      paymentMethod: 'cash',
    });
  },

  getSalaryPayments: async () => http.get('/Employee/salary-payments').catch(() => []),

  createTransfer: async (data) => {
    const body = {
      sourceBranchId: data.sourceBranchId,
      destinationBranchId: data.destinationBranchId,
      notes: data.notes || '',
      items: (data.items || []).map(i => ({
        productId: i.productId,
        quantity: i.qty,
      })),
    };
    return http.post('/Transfer', body);
  },

  getOwnerDashboardStats: async (dateFrom = null, dateTo = null) => {
    const params = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const data = await http.get('/Report/dashboard', params);
    return data;
  },

  // Client statement
  getClientStatement: async (clientId) => http.get(`/Client/${clientId}/statement`),

  // Supplier independent payment (no purchase invoice)
  addSupplierPaymentIndep: async (supplierId, paymentData) => {
    const body = {
      amount: paymentData.amount,
      paymentMethod: payMethodToBackend[paymentData.paymentMethod] || 1,
      paymentDate: paymentData.date || getToday(),
      checkNumber: paymentData.checkNumber || null,
      notes: paymentData.notes || '',
    };
    return http.post(`/Supplier/${supplierId}/payment`, body);
  },

  // Get supplier statement
  getSupplierStatement: async (supplierId) => http.get(`/Supplier/${supplierId}/statement`),

  // Get all purchase invoices
  getAllPurchaseInvoices: async () => {
    const data = await http.get('/Purchase');
    return (data || []).map(mapPurchaseInvoice);
  },

  // Get single purchase invoice with items
  getPurchaseInvoiceById: async (id) => {
    const data = await http.get(`/Purchase/${id}`);
    return mapPurchaseInvoice(data);
  },

  // Add partial payment to a purchase invoice
  addPurchasePayment: async (purchaseId, paymentData) => {
    const body = {
      purchaseInvoiceId: purchaseId,
      amount: paymentData.amount,
      paymentMethod: payMethodToBackend[paymentData.paymentMethod] || 1,
      paymentDate: paymentData.date || getToday(),
      checkNumber: paymentData.checkNumber || null,
      notes: paymentData.notes || '',
    };
    return http.post(`/Purchase/${purchaseId}/payment`, body);
  },

  // Employee advance
  addEmployeeAdvance: async (employeeId, advanceData) => {
    return http.post(`/Employee/${employeeId}/advance`, {
      amount: advanceData.amount,
      advanceDate: advanceData.date || getToday(),
      notes: advanceData.notes || '',
    });
  },

  getEmployeeAdvances: async (employeeId) => {
    const data = await http.get(`/Employee/${employeeId}/advances`);
    return data || [];
  },

  getAllEmployeeAdvances: async () => {
    const data = await http.get('/Employee/advances');
    return data || [];
  },

  getEmployeeSalaryHistory: async (employeeId) => {
    const data = await http.get(`/Employee/${employeeId}/salary-history`);
    return data || [];
  },

  // Cancel invoice
  cancelInvoice: async (invoiceId) => http.put(`/Invoice/${invoiceId}/cancel`),

  // Daily revenue all branches
  getDailyRevenueAllBranches: async (date) => {
    const data = await http.get('/Invoice/daily-revenue/all', { date });
    return data;
  },

  // Inventory matrix
  getInventoryMatrix: async () => http.get('/Inventory/matrix'),
  getLowStockCount: async () => http.get('/Inventory/low-stock/count'),

  // Reports
  getRevenueByPayment: async (dateFrom, dateTo) => {
    return http.get('/Report/revenue-by-payment', { dateFrom, dateTo });
  },

  getBranchMonthlyReport: async (branchId, month, year) => {
    return http.get(`/Report/branch/${branchId}/monthly`, { month, year });
  },

  getTopProducts: async (count = 10) => {
    return http.get('/Report/products/top', { count });
  },

  getSalarySummary: async (dateFrom, dateTo) => {
    return http.get('/Report/salary-summary', { dateFrom, dateTo });
  },

  getPnL: async (dateFrom = null, dateTo = null, branchId = null) => {
    const params = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (branchId) params.branchId = branchId;
    return http.get('/Report/pnl', params);
  },

  getDailyAllBranches: async (date) => {
    return http.get('/Report/daily-all', { date });
  },

  getBranchComparison: async (dateFrom = null, dateTo = null) => {
    const params = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return http.get('/Report/branch-comparison', params);
  },

  getTopProductsFiltered: async (dateFrom = null, dateTo = null, branchId = null, limit = 10, sortBy = 'revenue') => {
    const params = { limit, sortBy };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (branchId) params.branchId = branchId;
    return http.get('/Report/top-products', params);
  },

  getInventoryValue: async () => http.get('/Report/inventory-value'),

  getDeferredAging: async () => http.get('/Report/deferred-aging'),

  getDeferredCollections: async (dateFrom, dateTo) => {
    return http.get('/Report/deferred-collections', { dateFrom, dateTo });
  },

  getSalarySummaryDetailed: async (month = null, year = null, branchId = null) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    if (branchId) params.branchId = branchId;
    return http.get('/Report/salary-summary-detailed', params);
  },

  getLedger: async (dateFrom = null, dateTo = null, branchId = null) => {
    const params = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (branchId) params.branchId = branchId;
    return http.get('/Report/ledger', params);
  },

  // === Filtered (paged) endpoints ===
  getClientsFiltered: async (filter = {}) => {
    const params = {};
    if (filter.search) params.search = filter.search;
    if (filter.hasDeferredOnly) params.hasDeferredOnly = filter.hasDeferredOnly;
    if (filter.page) params.pageNumber = filter.page;
    if (filter.pageSize) params.pageSize = filter.pageSize;
    return http.get('/Client/filtered', params);
  },

  getSuppliersFiltered: async (filter = {}) => {
    const params = {};
    if (filter.search) params.search = filter.search;
    if (filter.hasDueOnly) params.hasDueOnly = filter.hasDueOnly;
    if (filter.page) params.pageNumber = filter.page;
    if (filter.pageSize) params.pageSize = filter.pageSize;
    return http.get('/Supplier/filtered', params);
  },

  getProductsFiltered: async (filter = {}) => {
    const params = {};
    if (filter.search) params.search = filter.search;
    if (filter.categoryId) params.categoryId = filter.categoryId;
    if (filter.branchId) params.branchId = filter.branchId;
    if (filter.page) params.pageNumber = filter.page;
    if (filter.pageSize) params.pageSize = filter.pageSize;
    return http.get('/Product/filtered', params);
  },

  getTransfersFiltered: async (filter = {}) => {
    const params = {};
    if (filter.search) params.search = filter.search;
    if (filter.status) params.status = filter.status;
    if (filter.branchId) params.branchId = filter.branchId;
    if (filter.dateFrom) params.dateFrom = filter.dateFrom;
    if (filter.dateTo) params.dateTo = filter.dateTo;
    if (filter.page) params.pageNumber = filter.page;
    if (filter.pageSize) params.pageSize = filter.pageSize;
    return http.get('/Transfer/filtered', params);
  },

  getEmployeesFiltered: async (filter = {}) => {
    const params = {};
    if (filter.search) params.search = filter.search;
    if (filter.branchId) params.branchId = filter.branchId;
    if (filter.role) params.role = filter.role;
    if (filter.isActive !== undefined) params.isActive = filter.isActive;
    if (filter.page) params.pageNumber = filter.page;
    if (filter.pageSize) params.pageSize = filter.pageSize;
    return http.get('/Employee/filtered', params);
  },

  getPurchaseInvoicesFiltered: async (filter = {}) => {
    const params = {};
    if (filter.search) params.search = filter.search;
    if (filter.supplierId) params.supplierId = filter.supplierId;
    if (filter.status) params.status = filter.status;
    if (filter.dateFrom) params.dateFrom = filter.dateFrom;
    if (filter.dateTo) params.dateTo = filter.dateTo;
    if (filter.page) params.pageNumber = filter.page;
    if (filter.pageSize) params.pageSize = filter.pageSize;
    const data = await http.get('/Purchase/filtered', params);
    return data?.items ? data : { items: (data || []).map(mapPurchaseInvoice), totalCount: 0, pageNumber: 1, pageSize: 20 };
  },

};

function mapInvoice(data) {
  if (!data) return data;
  
  const typeKey = data.type;
  const mappedType = invTypeFromBackend[typeKey] || (typeof typeKey === 'string' ? typeKey.toLowerCase() : typeKey);
  
  const payKey = data.paymentMethod;
  const mappedPay = payKey 
    ? (payMethodFromBackend[payKey] || (typeof payKey === 'string' ? payKey.toLowerCase() : payKey))
    : null;

  return {
    ...data,
    type: mappedType,
    paymentMethod: mappedPay,
    deferredInvoiceId: data.deferredInvoice?.id ?? data.deferredInvoiceId ?? null,
    remainingAmount: data.deferredInvoice?.remainingAmount ?? data.remainingAmount ?? null,
    paidAmount: data.deferredInvoice?.paidAmount ?? data.paidAmount ?? null,
    dueDate: data.dueDate ?? data.deferredInvoice?.dueDate ?? data.deferredDueDate ?? null,
    items: (data.items || []).map(i => ({
      productId: i.productId,
      productName: i.productName,
      qty: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
  };
}

function mapPurchaseInvoice(data) {
  if (!data) return data;
  const payKey = data.paymentMethod;
  const mappedPay = payKey
    ? (payMethodFromBackend[payKey] || (typeof payKey === 'string' ? payKey.toLowerCase() : payKey))
    : null;
  return {
    ...data,
    type: 'purchase',
    paymentMethod: mappedPay,
    items: (data.items || []).map(i => ({
      productId: i.productId || i.productName,
      productName: i.productName,
      qty: i.quantity,
      unitCost: i.unitCost,
      totalCost: i.totalCost,
    })),
  };
}

export default api;
