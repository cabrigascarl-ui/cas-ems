/**
 * The standard opening block for every in-app page: an icon plate, a title,
 * an optional one-line explanation, and a right-aligned slot for page-level
 * actions (export, print, "new item"…). Keeping it in one place is what makes
 * sixteen different screens read as one product.
 */
export default function PageHeader({ title, subtitle, icon, actions, children }) {
  return (
    <div className="page-header">
      {/* minWidth:0 lets a long title wrap instead of pushing the actions off-row. */}
      <div style={{ minWidth: 0 }}>
        <h1 className="page-title">
          {icon && (
            <span className="page-icon">
              <i className={`bi ${icon}`}></i>
            </span>
          )}
          <span>{title}</span>
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="d-flex flex-wrap align-items-center gap-2 no-print">{actions}</div>}
    </div>
  );
}
