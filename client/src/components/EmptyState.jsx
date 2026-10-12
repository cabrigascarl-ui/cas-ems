/**
 * Shown in place of content when there's genuinely nothing to display.
 * `colSpan` renders it as a full-width table row so it can drop straight
 * into an existing <tbody> without restructuring the table.
 */
export default function EmptyState({ icon = 'bi-inbox', title, text, action, colSpan }) {
  const body = (
    <div className="empty-state">
      <div className="empty-icon">
        <i className={`bi ${icon}`}></i>
      </div>
      {title && <div className="empty-title">{title}</div>}
      {text && <p className="empty-text">{text}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );

  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-0 border-0">{body}</td>
      </tr>
    );
  }
  return body;
}
