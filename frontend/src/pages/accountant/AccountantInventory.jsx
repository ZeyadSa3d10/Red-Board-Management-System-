import { useState, useEffect } from 'react';
import api from '../../api/realApi';
import StockTable from '../../components/inventory/StockTable';

const AccountantInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await api.getAllStock();
      setProducts(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>المخزون الكامل</h2>
      </div>
      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : (
        <>
          <StockTable products={products} />
        </>
      )}
    </div>
  );
};

export default AccountantInventory;
