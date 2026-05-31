const FilterGroup = ({ label, icon: Icon, children }) => {
  return (
    <div className="filter-group">
      {label && (
        <label>
          {Icon && <Icon size={14} style={{ marginLeft: 4 }} />}
          {label}
        </label>
      )}
      {children}
    </div>
  );
};

export default FilterGroup;
