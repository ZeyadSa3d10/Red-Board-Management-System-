import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BsBoxes, BsPeople, BsTruck, BsReceipt, BsPersonBadge } from 'react-icons/bs';
import api from '../../api/realApi';

const ROLE_ENTITIES = {
  owner: ['products', 'clients', 'suppliers', 'invoices', 'employees', 'transfers'],
  accountant: ['products', 'clients', 'suppliers', 'invoices'],
  staff: ['products', 'invoices', 'transfers'],
};

const ALL_ENTITIES = [
  { key: 'products', label: 'المنتجات', icon: BsBoxes, fields: ['name', 'barcode'] },
  { key: 'clients', label: 'العملاء', icon: BsPeople, fields: ['name', 'phone'] },
  { key: 'suppliers', label: 'الموردون', icon: BsTruck, fields: ['name', 'phone'] },
  { key: 'invoices', label: 'الفواتير', icon: BsReceipt, fields: ['invoiceNumber', 'clientName'], load: (api) => api.getInvoices({}) },
  { key: 'employees', label: 'الموظفون', icon: BsPersonBadge, fields: ['name'] },
  { key: 'transfers', label: 'التحويلات', icon: BsPersonBadge, fields: ['id'], load: (api) => api.getTransfers() },
];

const LOADERS = {
  products: async (api) => {
    const [products, stock] = await Promise.all([
      api.getProducts(),
      api.getAllStock().catch(() => []),
    ]);
    const stockMap = {};
    (stock || []).forEach(s => {
      (s.branchStocks || []).forEach(inv => {
        if (!stockMap[s.id]) stockMap[s.id] = {};
        stockMap[s.id][inv.branchId] = inv.quantity || 0;
      });
    });
    return (products || []).map(p => ({
      ...p,
      _stock: stockMap[p.id] || {},
      _totalStock: Object.values(stockMap[p.id] || {}).reduce((a, b) => a + b, 0),
    }));
  },
  clients: (api) => api.getClients(),
  suppliers: (api) => api.getSuppliers(),
  employees: (api) => api.getEmployees(),
};

const MAX_PER_ENTITY = 5;

const getItemName = (entityKey, item, role) => {
  if (entityKey === 'invoices') return `#${item.invoiceNumber || item.id} - ${item.clientName || ''}`;
  if (entityKey === 'transfers') return `#${item.id}`;
  if (entityKey === 'products') {
    const roleName = role === 'owner' ? 'المدير' : role === 'accountant' ? 'محاسب' : '';
    const parts = [item.name || ''];
    if (item.barcode) parts.push(`[${item.barcode}]`);
    return parts.join(' ');
  }
  return item.name || item.clientName || '';
};

const getItemSub = (entityKey, item, role, userBranchId) => {
  if (entityKey === 'products') {
    const parts = [];
    if (role === 'owner') {
      if (item.categoryName) parts.push(`📁 ${item.categoryName}`);
      parts.push(`💰 ${(item.currentSalePrice || 0).toLocaleString()}`);
      parts.push(`📦 إجمالي المخزون: ${item._totalStock || 0}`);
    } else if (role === 'accountant') {
      if (item.barcode) parts.push(`🏷 ${item.barcode}`);
      parts.push(`💰 بيع: ${(item.currentSalePrice || 0).toLocaleString()}`);
      if (item.purchasePrice) parts.push(`شراء: ${(item.purchasePrice || 0).toLocaleString()}`);
    } else {
      if (item.barcode) parts.push(`🏷 ${item.barcode}`);
      parts.push(`💰 ${(item.currentSalePrice || 0).toLocaleString()}`);
      const stockQty = userBranchId ? (item._stock?.[userBranchId] || 0) : null;
      if (stockQty != null) parts.push(`📦 متاح: ${stockQty}`);
    }
    return parts.join(' | ');
  }
  if (entityKey === 'clients') return item.phone || '';
  if (entityKey === 'suppliers') return item.phone || '';
  if (entityKey === 'invoices') return `${(item.totalAmount || 0).toLocaleString()} ج.م`;
  return '';
};

const GlobalSearch = ({ query }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef(null);

  const getEntities = useCallback(() => {
    const allowed = ROLE_ENTITIES[user?.role] || ROLE_ENTITIES.owner;
    return ALL_ENTITIES.filter(e => allowed.includes(e.key));
  }, [user]);

  const loadAll = useCallback(async () => {
    if (cacheRef.current) { setAllData(cacheRef.current); return; }
    setLoading(true);
    const entities = getEntities();
    const loaders = entities.map(e => {
      const loader = e.load || LOADERS[e.key];
      if (!loader) return Promise.resolve({ key: e.key, data: [] });
      return loader(api).then(data => {
        const items = Array.isArray(data) ? data : (data.$values || []);
        return { key: e.key, data: items };
      }).catch(() => ({ key: e.key, data: [] }));
    });
    const results = await Promise.all(loaders);
    const map = {};
    results.forEach(r => { map[r.key] = r.data; });
    cacheRef.current = map;
    setAllData(map);
    setLoading(false);
  }, [getEntities]);

  const q = query?.trim().toLowerCase() || '';
  const hasQuery = q.length >= 1;

  useEffect(() => {
    if (hasQuery && !cacheRef.current) loadAll();
    else if (hasQuery && cacheRef.current) setAllData(cacheRef.current);
  }, [hasQuery, loadAll]);

  const results = [];
  if (allData && hasQuery) {
    getEntities().forEach(entity => {
      const items = allData[entity.key] || [];
      const matched = items.filter(item =>
        entity.fields.some(f => {
          const val = item[f];
          return val != null && String(val).toLowerCase().includes(q);
        })
      ).slice(0, MAX_PER_ENTITY);
      if (matched.length > 0) results.push({ ...entity, matched });
    });
  }

  const handleClick = (entityKey, item) => {
    const name = encodeURIComponent(getItemName(entityKey, item, user?.role));
    switch (entityKey) {
      case 'products':
        navigate(user?.role === 'owner' ? `/owner/products?search=${name}` : `/branch/inventory?search=${name}`);
        break;
      case 'clients':
        navigate(user?.role === 'owner' ? `/owner/customers?search=${name}` : `/accountant/clients?search=${name}`);
        break;
      case 'suppliers':
        navigate(user?.role === 'owner' ? `/owner/suppliers?search=${name}` : `/accountant/suppliers?search=${name}`);
        break;
      case 'invoices':
        navigate(`/branch/invoices?search=${item.invoiceNumber || item.id}`);
        break;
      case 'employees':
        navigate(user?.role === 'owner' ? `/owner/employees?search=${name}` : `/branch/employees?search=${name}`);
        break;
      case 'transfers':
        navigate(`/branch/transfers?search=${item.id}`);
        break;
    }
  };

  if (!hasQuery || (!loading && results.length === 0)) {
    if (!hasQuery) return null;
    return (
      <div style={{
        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
        background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-modal)', border: '1px solid var(--color-border)',
        zIndex: 2000, padding: 24, textAlign: 'center',
        color: 'var(--color-text-muted)', fontSize: '0.85rem',
      }}>
        {loading ? 'جاري البحث...' : 'لا توجد نتائج'}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
        background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-modal)', border: '1px solid var(--color-border)',
        zIndex: 2000, padding: 24, textAlign: 'center',
        color: 'var(--color-text-muted)', fontSize: '0.85rem',
      }}>
        جاري البحث...
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
      background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-modal)', border: '1px solid var(--color-border)',
      zIndex: 2000, maxHeight: 480, overflowY: 'auto',
    }}>
      {results.map(entity => {
        const Icon = entity.icon;
        return (
          <div key={entity.key}>
            <div style={{
              padding: '8px 16px', background: 'var(--color-surface-alt)',
              fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', gap: 6,
              borderBottom: '1px solid var(--color-border)',
            }}>
              <Icon size={14} />
              {entity.label} ({entity.matched.length})
            </div>
            {entity.matched.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => handleClick(entity.key, item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 16px', cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {getItemName(entity.key, item, user?.role)}
                  </div>
                  {getItemSub(entity.key, item, user?.role, user?.branchId) && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {getItemSub(entity.key, item, user?.role, user?.branchId)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default GlobalSearch;
