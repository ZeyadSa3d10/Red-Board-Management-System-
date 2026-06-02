import { BsChevronDown } from 'react-icons/bs';

const SelectFilter = ({
  value,
  onChange,
  options = [],
  allLabel = 'الكل',
  label,
  icon: Icon,
  placeholder,
  loading = false,
}) => {
  return (
    <div className="filter-group">
      {label && (
        <label>
          {Icon && <Icon size={14} />}
          {label}
        </label>
      )}
      <div className="select-filter-wrapper">
        <select
          className="form-control-custom"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={loading}
        >
          <option value="">{allLabel}</option>
          {options.map(opt => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const lbl = typeof opt === 'string' ? opt : opt.label;
            return <option key={val} value={val}>{lbl}</option>;
          })}
        </select>
        <BsChevronDown size={12} className="select-filter-arrow" />
      </div>
    </div>
  );
};

export default SelectFilter;
