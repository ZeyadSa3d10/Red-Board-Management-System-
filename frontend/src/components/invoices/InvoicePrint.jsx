import { useRef } from 'react';
import { formatCurrency, formatInvoiceType, formatDateTime } from '../../utils/formatters';
import { BsPrinter } from 'react-icons/bs';

const escapeHtml = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const InvoicePrint = ({ invoice }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html dir="rtl" lang="ar">
      <head>
        <title>فاتورة #${escapeHtml(invoice.invoiceNumber)}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background: #f5f5f5; }
          .header { text-align: center; margin-bottom: 24px; }
          .total { font-size: 1.2rem; font-weight: 700; text-align: left; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>فاتورة ضريبية</h2>
          <p>رقم: ${escapeHtml(invoice.invoiceNumber)}</p>
          <p>التاريخ: ${escapeHtml(formatDateTime(invoice.createdAt))}</p>
          <p>النوع: ${escapeHtml(formatInvoiceType(invoice.type))}</p>
        </div>
        ${invoice.type === 'supply_installation' || invoice.type === 'return_supply_installation'
          ? `<p><strong>اسم المشروع:</strong> ${escapeHtml(invoice.projectName || '—')}</p>`
          : `<p><strong>العميل:</strong> ${escapeHtml(invoice.clientName || 'عميل نقدي')}</p>`
        }
        ${invoice.paymentReference ? `<p><strong>${
          invoice.paymentMethod === 'vodafone_cash' ? 'رقم الموبايل المحول إليه:' :
          invoice.paymentMethod === 'bank_transfer' ? 'اسم المحول إليه:' :
          'رقم الشيك:'
        }</strong> ${escapeHtml(invoice.paymentReference)}</p>` : ''}
        <table>
          <thead>
            <tr><th>المنتج</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${escapeHtml(item.productName) || escapeHtml(item.productId)}</td>
                <td>${escapeHtml(item.quantity || item.qty)}</td>
                <td>${item.unitPrice ? escapeHtml(formatCurrency(item.unitPrice)) : '-'}</td>
                <td>${item.totalPrice ? escapeHtml(formatCurrency(item.totalPrice)) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">الإجمالي: ${escapeHtml(formatCurrency(invoice.totalAmount))}</div>
        ${invoice.notes ? `<p><strong>ملاحظات:</strong> ${escapeHtml(invoice.notes)}</p>` : ''}
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <button className="btn-custom btn-custom-outline btn-custom-sm" onClick={handlePrint}>
      <BsPrinter size={16} /> طباعة
    </button>
  );
};

export default InvoicePrint;
