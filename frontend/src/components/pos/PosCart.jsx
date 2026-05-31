import { BsTrash, BsCart3 } from 'react-icons/bs';
import { formatCurrency } from '../../utils/formatters';

const PosCart = ({ items, onUpdateQty, onRemoveItem, onUpdatePrice, simple }) => {
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

  if (items.length === 0) {
    return (
      <>
        <div className="pos-cart-header">
          <h3>{simple ? 'أصناف التحويل' : 'الفاتورة'}</h3>
        </div>
        <div className="pos-cart-items">
          <div className="pos-cart-empty">
            <BsCart3 size={48} />
            <span>{simple ? 'لم يتم إضافة أصناف بعد' : 'لم يتم إضافة منتجات بعد'}</span>
            <span style={{ fontSize: '0.8rem' }}>{simple ? 'اختر صنفاً من القائمة' : 'اختر منتجاً من القائمة'}</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pos-cart-header">
        <h3>{simple ? 'أصناف التحويل' : 'الفاتورة'}</h3>
        <span className="pos-cart-count">{totalItems}</span>
      </div>
      <div className="pos-cart-items">
        {items.map((item, idx) => {
          const lineTotal = item.qty * item.unitPrice;
          return (
            <div key={item.productId} className="pos-cart-item">
              <div className="pos-cart-item-info">
                <div className="pos-cart-item-name">{item.productName}</div>
                {!simple && (
                  <input
                    className="pos-cart-item-price-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e => onUpdatePrice?.(idx, Math.max(0, Number(e.target.value)))}
                  />
                )}
              </div>
              <div className="pos-cart-item-qty">
                <button
                  className="pos-cart-qty-btn minus"
                  onClick={() => onUpdateQty(idx, item.qty - 1)}
                >
                  -
                </button>
                <input
                  className="pos-cart-qty-input"
                  type="number"
                  min="0"
                  value={item.qty}
                  onChange={e => onUpdateQty(idx, Math.max(0, Number(e.target.value)))}
                />
                <button
                  className="pos-cart-qty-btn"
                  onClick={() => onUpdateQty(idx, item.qty + 1)}
                >
                  +
                </button>
              </div>
              {!simple && <div className="pos-cart-item-total">{formatCurrency(lineTotal)}</div>}
              <button
                className="pos-cart-item-remove"
                onClick={() => onRemoveItem(idx)}
                title="حذف"
              >
                <BsTrash size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default PosCart;
