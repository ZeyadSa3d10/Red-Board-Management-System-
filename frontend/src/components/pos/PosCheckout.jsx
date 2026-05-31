import { BsCheckCircle, BsPrinter, BsPlus } from 'react-icons/bs';
import { formatCurrency } from '../../utils/formatters';
import InvoicePrint from '../invoices/InvoicePrint';

const PosCheckout = ({ invoice, onNewInvoice }) => {
  return (
    <div className="pos-checkout-overlay" onClick={onNewInvoice}>
      <div className="pos-checkout-modal" onClick={e => e.stopPropagation()}>
        <div className="checkout-icon">
          <BsCheckCircle />
        </div>
        <h2>تم حفظ الفاتورة</h2>
        <div className="invoice-number">{invoice.invoiceNumber}</div>
        <p>الإجمالي: {formatCurrency(invoice.totalAmount)}</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 20 }}>
          {new Date().toLocaleString('ar-EG')}
        </p>
        <div className="pos-checkout-actions">
          <InvoicePrint invoice={invoice} />
          <button
            style={{ background: 'var(--color-accent)', color: 'white' }}
            onClick={onNewInvoice}
          >
            <BsPlus size={18} /> فاتورة جديدة
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosCheckout;
