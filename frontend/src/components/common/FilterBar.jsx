import { BsFunnel, BsX } from 'react-icons/bs';

const FilterBar = ({ variant = 'simple', children, onReset, activeCount = 0 }) => {
  return (
    <div className={`filter-bar filter-bar--${variant}`}>
      {children}
      {onReset && activeCount > 0 && (
        <div className="filter-actions">
          <button className="btn-custom btn-custom-outline btn-custom-sm" onClick={onReset}>
            <BsX size={16} />
            <span>إعادة ضبط</span>
            {activeCount > 0 && <span className="badge-filter-count">{activeCount}</span>}
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
