const ICONS = {
  danger: 'bi-exclamation-octagon-fill',
  success: 'bi-check-circle-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

export default function Alert({ type = 'danger', children, onClose }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type} d-flex align-items-start gap-2`} role="alert">
      <i className={`bi ${ICONS[type] || ICONS.info} flex-shrink-0`} style={{ marginTop: '0.1rem' }}></i>
      <div className="flex-fill">{children}</div>
      {onClose && (
        <button type="button" className="btn-close flex-shrink-0" onClick={onClose} aria-label="Close" style={{ fontSize: '0.7rem' }} />
      )}
    </div>
  );
}
