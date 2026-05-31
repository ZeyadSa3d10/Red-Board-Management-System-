import { PAYMENT_METHODS, INVOICE_TYPES } from '../../api/realApi';
import ClientSearch from './ClientSearch';

const PosSummary = ({
  invoiceType, setInvoiceType,
  paymentMethod, setPaymentMethod,
  selectedClient, setSelectedClient,
  dueDate, setDueDate,
  clients,
  selectedBranch, setSelectedBranch,
  branches,
  user,
  onAddClientClick,
}) => {
  const invoiceTypeOptions = [
    { value: INVOICE_TYPES.SALE, label: 'بيع نقدي', roles: ['owner', 'staff'] },
    { value: INVOICE_TYPES.SALE_DEFERRED, label: 'بيع آجل', roles: ['owner', 'staff'] },
    { value: INVOICE_TYPES.RETURN_SALE, label: 'مرتجع نقدي', roles: ['owner', 'staff'] },
  ];

  const allowedTypes = invoiceTypeOptions.filter(t => t.roles.includes(user?.role));
  const showPaymentMethod = invoiceType === INVOICE_TYPES.SALE || invoiceType === INVOICE_TYPES.RETURN_SALE;
  const showClient = invoiceType === INVOICE_TYPES.SALE || invoiceType === INVOICE_TYPES.SALE_DEFERRED || invoiceType === INVOICE_TYPES.RETURN_DEFERRED;
  const showDueDate = invoiceType === INVOICE_TYPES.SALE_DEFERRED;

  return (
    <div className="pos-actions">
      <div className="pos-invoice-types">
        {allowedTypes.map(t => (
          <button
            key={t.value}
            className={`pos-type-btn ${invoiceType === t.value ? 'active' : ''}`}
            onClick={() => setInvoiceType(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pos-extra-options">
        {user?.role === 'owner' && (
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
            <option value="">اختار الفرع</option>
            {branches.filter(b => !b.isAdmin).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
        {showClient && (
          <ClientSearch
            clients={clients}
            value={selectedClient}
            onChange={setSelectedClient}
            onAddNew={onAddClientClick}
          />
        )}
        {showDueDate && (
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        )}
      </div>

      {showPaymentMethod && (
        <div className="pos-payment-methods">
          {[
            { value: PAYMENT_METHODS.CASH, label: 'نقدي' },
            { value: PAYMENT_METHODS.BANK_TRANSFER, label: 'تحويل بنكي' },
            { value: PAYMENT_METHODS.CHECK, label: 'شيك' },
            { value: PAYMENT_METHODS.VODAFONE_CASH, label: 'فودافون كاش' },
          ].map(pm => (
            <button
              key={pm.value}
              className={`pos-pm-btn ${paymentMethod === pm.value ? 'active' : ''}`}
              onClick={() => setPaymentMethod(pm.value)}
            >
              {pm.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export { PosSummary };
export default PosSummary;
