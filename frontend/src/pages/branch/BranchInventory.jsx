import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/realApi';
import StockTable from '../../components/inventory/StockTable';

const BranchInventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [allStockMap, setAllStockMap] = useState({});
  const [loading, setLoading] = useState(true);
  const branchId = user?.branchId;

  useEffect(() => {
    const load = async () => {
      const [data, stockData, branchData] = await Promise.all([
        api.getProductsByBranch(branchId),
        api.getAllStock().catch(() => []),
        api.getBranches(),
      ]);
      setProducts(data);

      const map = {};
      (stockData || []).forEach(p => {
        map[p.id] = p.branchStocks || [];
      });
      setAllStockMap(map);
      setBranches(branchData.filter(b => !b.isAdminBranch));
      setLoading(false);
    };
    load();
  }, [branchId]);

  return (
    <div>
      <div className="page-header">
        <h2>مخزون الفرع</h2>
      </div>
      {loading ? (
        <div className="loading-container"><div className="spinner-border" /></div>
      ) : (
        <>
          <StockTable products={products} branchId={branchId} otherBranches={branches} allStockMap={allStockMap} userRole={user?.role} />
        </>
      )}
    </div>
  );
};

export default BranchInventory;
