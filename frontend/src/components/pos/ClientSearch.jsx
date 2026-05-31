import { useState, useRef, useEffect } from 'react';
import { BsPlusLg, BsCheckLg, BsSearch } from 'react-icons/bs';

const ClientSearch = ({ clients, value, onChange, onAddNew }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (value) {
      const found = clients.find(c => c.id === value);
      if (found) {
        setSelected(found);
        setQuery(found.phone || '');
      }
    } else {
      setSelected(null);
      setQuery('');
    }
  }, [value, clients]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.trim()) {
      const filtered = clients.filter(c =>
        (c.phone && c.phone.includes(q)) ||
        c.name.toLowerCase().includes(q.toLowerCase())
      );
      setResults(filtered);
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
    if (!q) {
      setSelected(null);
      onChange('');
    }
  };

  const handleSelect = (client) => {
    setSelected(client);
    setQuery(client.phone || '');
    setShowDropdown(false);
    onChange(client.id);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      {selected ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}>
          <BsCheckLg color="var(--color-success)" size={14} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {selected.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {selected.phone || 'بدون هاتف'}
            </div>
          </div>
          <button
            type="button"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', fontSize: '0.8rem', padding: '2px 6px',
            }}
            onClick={() => { setSelected(null); setQuery(''); onChange(''); }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <BsSearch size={14} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="ابحث برقم الهاتف أو الاسم..."
            value={query}
            onChange={handleSearch}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            style={{
              width: '100%', padding: '8px 32px 8px 8px', fontSize: '0.85rem',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
            }}
          />
        </div>
      )}

      {showDropdown && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxHeight: 250, overflowY: 'auto', marginTop: 4,
        }}>
          {results.length === 0 && query.trim() ? (
            <div style={{
              padding: '12px 16px', fontSize: '0.85rem',
              color: 'var(--color-text-muted)', textAlign: 'center',
            }}>
              لا يوجد عميل بهذا الرقم
              <button
                type="button"
                className="btn-custom btn-custom-sm btn-custom-primary"
                style={{ marginTop: 8, width: '100%' }}
                onClick={() => { setShowDropdown(false); onAddNew(query); }}
              >
                <BsPlusLg size={12} style={{ marginLeft: 6 }} />
                إضافة عميل جديد
              </button>
            </div>
          ) : (
            results.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {c.phone ? `📞 ${c.phone}` : ''} {c.address ? `📍 ${c.address}` : ''}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSearch;
