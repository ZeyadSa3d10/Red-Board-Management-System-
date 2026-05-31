import { useState, useMemo, useRef, useEffect } from 'react';
import { BsSearch, BsUpcScan } from 'react-icons/bs';

const ProductGrid = ({ products, onSelectProduct }) => {
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const barcodeRef = useRef(null);

  const categories = useMemo(() => {
    const cats = products.reduce((acc, p) => {
      if (p.categoryId && p.categoryName) {
        if (!acc.find(c => c.id === p.categoryId)) {
          acc.push({ id: p.categoryId, name: p.categoryName });
        }
      }
      return acc;
    }, []);
    return cats;
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory) {
      result = result.filter(p => p.categoryId === activeCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
      );
    }
    return result.slice(0, 100);
  }, [products, activeCategory, search]);

  useEffect(() => {
    if (barcode.length >= 3) {
      const product = products.find(p => p.barcode === barcode);
      if (product) {
        onSelectProduct(product);
        setBarcode('');
        barcodeRef.current?.focus();
      }
    }
  }, [barcode, products, onSelectProduct]);

  const handleProductClick = (product) => {
    onSelectProduct(product);
    if (barcodeRef.current) barcodeRef.current.focus();
  };

  return (
    <>
      <div className="pos-toolbar">
        <div className="pos-search-wrapper">
          <BsSearch className="pos-search-icon" size={16} />
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <input
          ref={barcodeRef}
          className="pos-barcode-input"
          type="text"
          placeholder="باركود"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
        />
        <BsUpcScan size={20} color="var(--color-text-muted)" />
      </div>

      <div className="pos-categories">
        <button
          className={`pos-cat-btn ${!activeCategory ? 'active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          الكل
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`pos-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="pos-products">
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
            {search ? 'لا توجد منتجات مطابقة للبحث' : 'لا توجد منتجات متاحة'}
          </div>
        ) : (
          filtered.map(product => (
            <div
              key={product.id}
              className="pos-product-card"
              onClick={() => handleProductClick(product)}
            >
              <div className="pos-prod-name">{product.name}</div>
              <div className={`pos-prod-stock ${(product.availableQty || 0) <= 0 ? 'out' : ''}`}>
                {(product.availableQty || 0) <= 0 ? 'غير متوفر' : `متاح: ${product.availableQty}`}
              </div>
              <div className="pos-prod-price">{product.currentSalePrice?.toLocaleString()}</div>
              <div className="pos-prod-unit">{product.unit || ''}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default ProductGrid;
