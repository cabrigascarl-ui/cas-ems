import { Link } from 'react-router-dom';

export default function StatCard({ label, value, icon, color = '', link, to, colClass = 'col-md-3', tone = 'brand', hint }) {
  const Wrapper = to ? Link : 'div';
  const className = `card stat-card tone-${tone} p-3 h-100${to ? ' text-decoration-none' : ''}`;
  const wrapperProps = to ? { to, className } : { className };

  return (
    <div className={colClass}>
      <Wrapper {...wrapperProps}>
        {icon && (
          <div className="stat-icon">
            <i className={`bi ${icon}`}></i>
          </div>
        )}
        <div className="stat-label">{label}</div>
        <div className={`stat-value fs-2 ${color}`}>{value}</div>
        {hint && (
          <div className="text-muted" style={{ fontSize: '0.75rem', position: 'relative', zIndex: 1 }}>{hint}</div>
        )}
        {link}
        {to && (
          <i
            className="bi bi-arrow-right-short stat-arrow text-muted"
            style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1, fontSize: '1.3rem' }}
          ></i>
        )}
      </Wrapper>
    </div>
  );
}
