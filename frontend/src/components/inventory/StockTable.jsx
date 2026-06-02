import { useMemo, useState, useRef, useEffect } from "react";
import { formatCurrency } from "../../utils/formatters";
import {
  BsExclamationTriangle,
  BsTrash,
  BsPencil,
  BsArrowDown,
  BsArrowUp,
  BsSearch,
} from "react-icons/bs";
import api from "../../api/realApi";
import { useNotifications } from "../../context/NotificationContext";
import FilterBar from "../../components/common/FilterBar";
import FilterSearch from "../../components/common/FilterSearch";

const StockTable = ({
  products,
  branchId,
  branches = [],
  onRefresh,
  onEdit,
  otherBranches = [],
  allStockMap = {},
  userRole,
  loading: externalLoading,
  serverSide,
  onServerFilter,
  totalCount,
  page: currentPage,
  onPageChange,
}) => {
  const showCost = userRole === "owner";
  const { addNotification } = useNotifications();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [localPage, setLocalPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(20);
  const [internalLoading, setInternalLoading] = useState(false);
  const tableRef = useRef(null);

  const loading = externalLoading ?? internalLoading;
  const page = serverSide ? (currentPage ?? localPage) : localPage;
  const setPage = serverSide ? (onPageChange ?? setLocalPage) : setLocalPage;
  const pageSize = serverSide ? 20 : visibleCount;

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.categoryName || p.categoryId))];
    return cats;
  }, [products]);

  const filtered = useMemo(() => {
    if (serverSide || !products) return products || [];
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.barcode?.includes(q),
      );
    }
    if (categoryFilter) {
      result = result.filter(
        (p) => (p.categoryName || p.categoryId) === categoryFilter,
      );
    }
    return result;
  }, [products, search, categoryFilter, serverSide]);

  const total = serverSide ? (totalCount ?? filtered.length) : filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const visibleItems = serverSide ? (filtered || []) : filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSearch = (value) => {
    setSearch(value);
    if (serverSide) {
      setPage(1);
      onServerFilter?.({ search: value, category: categoryFilter, page: 1 });
    }
  };

  const handleCategoryFilter = (value) => {
    setCategoryFilter(value);
    if (serverSide) {
      setPage(1);
      onServerFilter?.({ search, category: value, page: 1 });
    }
  };

  const lowStockItems = useMemo(
    () =>
      products.filter((p) => {
        const stock = branchId
          ? p.branchStocks?.find((b) => b.branchId === branchId)?.quantity || 0
          : p.totalQty || 0;
        return stock <= p.minStockAlert;
      }),
    [products, branchId],
  );

  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف المنتج "${name}"؟`)) {
      setInternalLoading(true);
      try {
        await api.deleteProduct(id);
        addNotification("تم حذف المنتج بنجاح", "success");
        if (onRefresh) onRefresh();
      } catch (err) {
        addNotification("فشل حذف المنتج. قد يكون مرتبطاً بمعاملات سابقة.", "danger");
      }
      setInternalLoading(false);
    }
  };

  const getBranchQty = (p, bId) => {
    return p.branchStocks?.find((b) => b.branchId === bId)?.quantity || 0;
  };

  const getBranchAvgCost = (p, bId) => {
    return p.branchStocks?.find((b) => b.branchId === bId)?.averageCost || 0;
  };

  const getOtherBranchQty = (productId, branchId) => {
    const stocks = allStockMap[productId];
    if (!stocks) return 0;
    const found = stocks.find((s) => s.branchId === branchId);
    return found ? found.quantity || 0 : 0;
  };

  return (
    <div>
      {lowStockItems.length > 0 && (
        <div
          className="card"
          style={{
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            borderColor: "var(--color-warning)",
            background: "var(--color-warning-light)",
          }}
        >
          <BsExclamationTriangle color="var(--color-warning)" size={20} />
          <span style={{ fontSize: "0.9rem" }}>
            {lowStockItems.length} منتجات تحت حد التنبيه
          </span>
        </div>
      )}

      <FilterBar variant="simple" loading={loading}>
        <FilterSearch
          value={search}
          onChange={handleSearch}
          placeholder="بحث بالاسم أو الباركود..."
        />
        <select
          className="form-control-custom"
          style={{ maxWidth: 200 }}
          value={categoryFilter}
          onChange={(e) => handleCategoryFilter(e.target.value)}
          disabled={loading}
        >
          <option value="">كل الفئات</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </FilterBar>

      <div style={{ overflowX: "auto" }} ref={tableRef}>
        <table className="table-custom">
          <thead>
            <tr>
              <th>الكود</th>
              <th>اسم المنتج</th>
              <th>الفئة</th>
              <th>الوحدة</th>
              {branchId ? (
                <>
                  <th className="th-accent">مخزني</th>
                  {otherBranches.map((b) => (
                    <th key={b.id} className="th-sub">{b.name}</th>
                  ))}
                </>
              ) : (
                <>
                  {branches.filter((b) => !b.isAdminBranch).map((b) => (
                    <th key={b.id}>{b.name}</th>
                  ))}
                  <th>الإجمالي</th>
                </>
              )}
              {showCost && <th>متوسط التكلفة</th>}
              <th>سعر البيع</th>
              {showCost && <th className="th-sub">بالتكلفة</th>}
              {!branchId && <th className="th-sale">بالبيع</th>}
              <th>الحالة</th>
              {onEdit && <th>إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={20} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner-border" role="status" />
                </td>
              </tr>
            ) : visibleItems.length === 0 ? (
              <tr>
                <td colSpan={20} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                  لا توجد منتجات
                </td>
              </tr>
            ) : (
              visibleItems.map((p) => {
                const total = branchId ? getBranchQty(p, branchId) : p.totalQty;
                const avgCost = branchId
                  ? getBranchAvgCost(p, branchId)
                  : total > 0 ? p.totalValue / total : p.purchasePrice || 0;
                const isLow = total <= p.minStockAlert;
                return (
                  <tr key={p.id}>
                    <td>{p.barcode || p.id}</td>
                    <td className="td-name">{p.name}</td>
                    <td>{p.categoryName}</td>
                    <td>{p.unit}</td>
                    {branchId ? (
                      <>
                        <td className="td-qty">{total}</td>
                        {otherBranches.map((b) => {
                          const qty = getOtherBranchQty(p.id, b.id);
                          return <td key={b.id} className={qty > 0 ? "td-other-active" : "td-other-muted"}>{qty}</td>;
                        })}
                      </>
                    ) : (
                      <>
                        {branches.filter((b) => !b.isAdminBranch).map((b) => (
                          <td key={b.id}>{getBranchQty(p, b.id)}</td>
                        ))}
                        <td className="td-total">{total}</td>
                      </>
                    )}
                    {showCost && <td className="mono">{formatCurrency(avgCost)}</td>}
                    <td className="mono">{formatCurrency(p.currentSalePrice)}</td>
                    {showCost && <td className="mono td-cost">{formatCurrency(branchId ? total * avgCost : p.totalValue)}</td>}
                    {!branchId && <td className="mono td-sale">{formatCurrency(total * p.currentSalePrice)}</td>}
                    <td>
                      <span className={`badge-custom ${isLow ? "badge-custom-danger" : "badge-custom-success"}`}>
                        {isLow ? "منخفض" : "متوفر"}
                      </span>
                    </td>
                    {onEdit && (
                      <td>
                        <button className="btn-icon" style={{ marginLeft: 8 }} title="تعديل المنتج" onClick={() => onEdit(p)}>
                          <BsPencil size={16} />
                        </button>
                        <button className="btn-icon btn-icon-danger" title="حذف المنتج" onClick={() => handleDelete(p.id, p.name)}>
                          <BsTrash size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading && <span className="spinner-border spinner-border-sm" />}
            عرض {Math.min((page - 1) * pageSize + 1, total)}-{Math.min(page * pageSize, total)} من {total}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-custom btn-custom-outline btn-custom-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>السابق</button>
            <button className="btn-custom btn-custom-outline btn-custom-sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>التالي</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTable;
