export const getToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });

export const formatCurrency = (amount, decimals = 2) =>
  `${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: decimals })} ج.م`;

const toDate = (s) => new Date(typeof s === 'string' && !s.endsWith('Z') ? s + 'Z' : s);

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return toDate(dateStr).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Cairo' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  return toDate(dateStr).toLocaleString('ar-EG-u-nu-latn', { timeZone: 'Africa/Cairo' });
};

export const formatInvoiceType = (type) => ({
  sale: 'بيع نقدي',
  sale_deferred: 'آجل',
  return_sale: 'مرتجع مبيعات',
  return_deferred: 'مرتجع آجل',
  transfer: 'تحويل',
  supply_installation: 'توريد و تركيب',
  return_supply_installation: 'مرتجع توريد وتركيب',
  deferred_payment: 'دفعة أجل',
  purchase: 'فاتورة مورد'
}[type] || type);

export const formatPaymentMethod = (method) => ({
  cash: 'نقدي',
  vodafone_cash: 'فودافون كاش',
  check: 'شيك',
  bank_transfer: 'تحويل بنكي'
}[method] || method);

export const formatInvoiceStatus = (status) => {
  const s = String(status || '').toLowerCase();
  return ({
    paid: { label: 'تم التسديد', color: 'success' },
    partial: { label: 'مدفوع جزئياً', color: 'warning' },
    unpaid: { label: 'غير مدفوع', color: 'danger' },
    overdue: { label: 'متأخر', color: 'danger' },
    cancelled: { label: 'ملغي', color: 'secondary' },
  }[s] || { label: status, color: 'secondary' });
};

export const formatRole = (role) => ({
  owner: 'المدير',
  accountant: 'محاسب',
  staff: 'موظف',
  Owner: 'المدير',
  Accountant: 'محاسب',
  Staff: 'موظف',
}[role] || role);

export const getInvoiceBadgeColor = (type) => ({
  sale: 'badge-invoice-cash',
  sale_deferred: 'badge-invoice-deferred',
  return_sale: 'badge-invoice-return',
  return_deferred: 'badge-invoice-return-deferred',
  transfer: 'badge-invoice-transfer',
  supply_installation: 'badge-invoice-supply-installation',
  return_supply_installation: 'badge-invoice-return-supply-installation',
  deferred_payment: 'badge-invoice-deferred-payment',
  purchase: 'badge-custom-warning',
}[type] || 'badge-custom-info');
