import { formatCurrency } from '../../utils/formatters';

const ProductCard = ({ product, branchId }) => {
  const stock = branchId ? product.stock?.[branchId] : product;
  const qty = branchId ? (stock?.qty || 0) : product.totalQty;
  const avgCost = branchId ? (stock?.avgCost || 0) : (product.totalValue / (product.totalQty || 1));
  const isLow = qty <= product.minStockAlert;

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <h6 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{product.name}</h6>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{product.id} | {product.unit}</span>
      </div>
      <div className="grid-2-sm" style={{ gap: 8, fontSize: '0.85rem' }}>
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>المخزون:</span>
          <span style={{ fontWeight: 600, marginRight: 4, color: isLow ? 'var(--color-danger)' : 'inherit' }}>{qty}</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>سعر البيع:</span>
          <span className="mono" style={{ marginRight: 4 }}>{formatCurrency(product.currentSalePrice)}</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>التكلفة:</span>
          <span className="mono" style={{ marginRight: 4 }}>{formatCurrency(avgCost)}</span>
        </div>
        <div>
          <span className={`badge-custom ${isLow ? 'badge-custom-danger' : 'badge-custom-success'}`}>
            {isLow ? 'منخفض' : 'متوفر'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
