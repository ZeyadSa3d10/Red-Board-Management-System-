import { formatCurrency, formatInvoiceType, formatDateTime, formatPaymentMethod, getInvoiceBadgeColor } from '../../utils/formatters';
import { BsPrinter } from 'react-icons/bs';

const InvoiceCard = ({ invoice, onPrint }) => {
  const isPurchase = invoice.type === 'purchase' || invoice.type === 'فاتورة مورد';
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h5 style={{ margin: 0, fontWeight: 600 }}>فاتورة #{invoice.invoiceNumber || invoice.id}</h5>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            {formatDateTime(invoice.createdAt || invoice.invoiceDate)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`badge-custom ${getInvoiceBadgeColor(invoice.type)}`}>{formatInvoiceType(invoice.type)}</span>
          {invoice.paymentMethod && (
            <span className="badge-custom badge-custom-secondary">{formatPaymentMethod(invoice.paymentMethod)}</span>
          )}
        </div>
      </div>
      {invoice.paymentReference && (
        <div style={{ marginBottom: 12, fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {invoice.paymentMethod === 'vodafone_cash' ? 'رقم الموبايل المحول إليه:' :
             invoice.paymentMethod === 'bank_transfer' ? 'اسم المحول إليه:' :
             'رقم الشيك:'}
          </span>
          <span style={{ fontWeight: 600, marginRight: 4 }}>{invoice.paymentReference}</span>
        </div>
      )}

      <div className="grid-2-sm" style={{ gap: 12, marginBottom: 16 }}>
        <div>
          {invoice.type === 'supply_installation' || invoice.type === 'return_supply_installation' ? (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>اسم المشروع:</span>
              <div style={{ fontWeight: 500 }}>{invoice.projectName || '—'}</div>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{isPurchase ? 'المورد:' : 'العميل:'}</span>
              <div style={{ fontWeight: 500 }}>{invoice.clientName || invoice.supplierName || (isPurchase ? 'مورد' : 'عميل نقدي')}</div>
            </>
          )}
        </div>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>صادر باسم:</span>
          <div style={{ fontWeight: 500 }}>{invoice.createdBy || invoice.addedByName || invoice.addedBy || '-'}</div>
        </div>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>الإجمالي:</span>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-accent)' }} className="mono">
            {formatCurrency(invoice.totalAmount)}
          </div>
        </div>
      </div>

      {invoice.items?.length > 0 && (
        <table className="table-custom" style={{ marginBottom: 12 }}>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>{isPurchase ? 'سعر التكلفة' : 'سعر الوحدة'}</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.productName || item.productId}</td>
                <td>{item.quantity ?? item.qty}</td>
                <td className="mono">{formatCurrency(item.unitCost ?? item.unitPrice ?? 0)}</td>
                <td className="mono">{formatCurrency(item.totalCost ?? item.totalPrice ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {invoice.notes && (
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          <strong>ملاحظات:</strong> {invoice.notes}
        </div>
      )}
    </div>
  );
};

export default InvoiceCard;
