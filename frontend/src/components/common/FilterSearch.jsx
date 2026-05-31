import { useState, useEffect, useRef } from 'react';
import { BsSearch } from 'react-icons/bs';

const FilterSearch = ({ value = '', onChange, placeholder = 'بحث...', debounceMs = 300 }) => {
  const [local, setLocal] = useState(value);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(v);
    }, debounceMs);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="filter-search">
      <BsSearch size={16} className="filter-search-icon" />
      <input
        className="form-control-custom"
        placeholder={placeholder}
        value={local}
        onChange={handleChange}
      />
    </div>
  );
};

export default FilterSearch;
