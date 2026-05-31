const colorMap = {
  success: 'badge-custom-success',
  warning: 'badge-custom-warning',
  danger: 'badge-custom-danger',
  info: 'badge-custom-info',
  secondary: 'badge-custom-secondary',
  primary: 'badge-custom-info',
};

const Badge = ({ label, color = 'secondary' }) => {
  return (
    <span className={`badge-custom ${colorMap[color] || colorMap.secondary}`}>
      {label}
    </span>
  );
};

export default Badge;
