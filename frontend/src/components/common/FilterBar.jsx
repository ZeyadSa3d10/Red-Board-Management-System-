import { useState } from 'react';
import { BsFunnel, BsX, BsChevronDown, BsChevronUp } from 'react-icons/bs';

const FilterBar = ({
  variant = 'simple',
  children,
  onReset,
  activeCount = 0,
  loading = false,
  collapsible = false,
  onApply,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const childrenArray = Array.isArray(children) ? children : [children];
  const [mainFilters, extraFilters] = collapsible && childrenArray.length > 3
    ? [childrenArray.slice(0, 2), childrenArray.slice(2)]
    : [childrenArray, []];

  return (
    <div className={`filter-bar filter-bar--${variant} ${loading ? 'filter-bar--loading' : ''}`}>
      {loading && (
        <div className="filter-bar-loader">
          <div className="spinner-border spinner-border-sm" role="status" />
        </div>
      )}

      {mainFilters.map((child, i) => (
        <div key={i} className="filter-bar-item">{child}</div>
      ))}

      {extraFilters.length > 0 && (
        <button
          className="btn-custom btn-custom-sm btn-custom-ghost"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'إظهار الفلاتر' : 'إخفاء الفلاتر'}
        >
          {collapsed ? <BsChevronDown size={14} /> : <BsChevronUp size={14} />}
          <span>فلاتر</span>
          {activeCount > 0 && <span className="badge-filter-count">{activeCount}</span>}
        </button>
      )}

      {!collapsed && extraFilters.length > 0 && (
        <div className="filter-bar-extra">
          {extraFilters.map((child, i) => (
            <div key={i} className="filter-bar-item">{child}</div>
          ))}
        </div>
      )}

      <div className="filter-bar-actions">
        {onApply && (
          <button className="btn-custom btn-custom-primary btn-custom-sm" onClick={onApply} disabled={loading}>
            تطبيق
          </button>
        )}
        {onReset && activeCount > 0 && (
          <button className="btn-custom btn-custom-outline btn-custom-sm" onClick={onReset}>
            <BsX size={16} />
            <span>إعادة ضبط</span>
            {activeCount > 0 && <span className="badge-filter-count">{activeCount}</span>}
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
