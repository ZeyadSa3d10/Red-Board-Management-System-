import { BsSearch } from 'react-icons/bs';

const SearchBar = ({ value, onChange, placeholder = 'بحث...', className }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 400 }} className={className}>
      <BsSearch size={16} color="var(--color-text-muted)" />
      <input
        className="form-control-custom"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
