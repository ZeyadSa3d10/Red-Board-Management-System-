import { BsArrowClockwise, BsDownload } from 'react-icons/bs';

const FilterActions = ({ onReset, activeCount = 0, onExport, exportLabel = 'تصدير CSV' }) => {
  return (
    <div className="filter-actions">
      {onExport && (
        <button className="btn-custom btn-custom-outline btn-custom-sm" onClick={onExport}>
          <BsDownload size={16} />
          <span>{exportLabel}</span>
        </button>
      )}
      {onReset && activeCount > 0 && (
        <button className="btn-custom btn-custom-outline btn-custom-sm" onClick={onReset}>
          <BsArrowClockwise size={16} />
          <span>إعادة ضبط</span>
          {activeCount > 0 && <span className="badge-filter-count">{activeCount}</span>}
        </button>
      )}
    </div>
  );
};

export default FilterActions;
