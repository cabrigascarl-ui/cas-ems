/**
 * The standard `.card-header` content: an icon plate, a title, an optional
 * count chip, and a right-aligned action slot. Swaps in for the many
 * hand-rolled "bare text" card headers across the dashboards so every panel
 * — not just the page-level header — carries the same icon+label identity.
 */
export default function PanelHeader({ icon, title, tone = 'brand', count, action }) {
  return (
    <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <span className="d-flex align-items-center gap-2">
        {icon && (
          <span className={`panel-icon tone-${tone}`}>
            <i className={`bi ${icon}`}></i>
          </span>
        )}
        <span>{title}</span>
        {count != null && <span className="count-chip">{count}</span>}
      </span>
      {action}
    </div>
  );
}
