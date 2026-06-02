import { useState, useMemo } from 'react';
import { BsArrowUp, BsArrowDown, BsSearch } from 'react-icons/bs';

const DataTable = ({
  columns,
  data,
  loading,
  onRowClick,
  searchable,
  pageSize = 15,
  serverSide,
  totalCount,
  page: currentPage,
  onPageChange,
  onSortChange,
  sortKey: controlledSortKey,
  sortDir: controlledSortDir,
  emptyMessage = 'لا توجد بيانات',
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [localSortKey, setLocalSortKey] = useState(null);
  const [localSortDir, setLocalSortDir] = useState('asc');
  const [localPage, setLocalPage] = useState(1);

  const sortKey = controlledSortKey ?? localSortKey;
  const sortDir = controlledSortDir ?? localSortDir;
  const page = serverSide ? (currentPage ?? localPage) : localPage;
  const setPage = serverSide ? (onPageChange ?? setLocalPage) : setLocalPage;

  const filtered = useMemo(() => {
    if (serverSide || !data) return data || [];
    let result = [...data];
    if (localSearch && searchable) {
      const q = localSearch.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          const val = row[col.key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        })
      );
    }
    return result;
  }, [data, localSearch, columns, searchable, serverSide]);

  const sorted = useMemo(() => {
    if (serverSide || !sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, serverSide]);

  const total = serverSide ? (totalCount ?? sorted.length) : sorted.length;
  const totalPages = Math.ceil(total / pageSize);
  const paged = serverSide ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    if (!serverSide) {
      setLocalSortKey(key);
      setLocalSortDir(newDir);
    }
    onSortChange?.(key, newDir);
  };

  if (loading && !data?.length) {
    return (
      <div className="card">
        <div className="loading-container">
          <div className="spinner-border" role="status" />
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {(searchable && !serverSide) && (
        <div className="filter-bar filter-bar--simple" style={{ margin: 0, borderRadius: 0, borderRight: 'none', borderLeft: 'none', borderTop: 'none' }}>
          <div className="filter-search">
            <BsSearch size={16} className="filter-search-icon" />
            <input
              className="form-control-custom"
              placeholder="بحث..."
              value={localSearch}
              onChange={e => { setLocalSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', position: 'relative', minHeight: data?.length ? 100 : 0 }}>
        {loading && data?.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <div className="spinner-border" role="status" />
          </div>
        )}
        <table className="table-custom">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ cursor: col.sortable !== false ? 'pointer' : 'default', width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.header}
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <BsArrowUp size={14} /> : <BsArrowDown size={14} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                  {loading ? (
                    <div className="spinner-border spinner-border-sm" role="status" />
                  ) : emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row.id || i} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading && <span className="spinner-border spinner-border-sm" />}
            عرض {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} من {total}
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

export default DataTable;
