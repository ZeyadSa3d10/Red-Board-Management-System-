const PageSkeleton = ({ rows = 5 }) => (
  <div className="skeleton-wrapper">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton-row animate-pulse" />
    ))}
  </div>
);

export default PageSkeleton;
