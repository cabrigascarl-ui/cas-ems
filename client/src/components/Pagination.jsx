import { PAGE_SIZE } from '../constants.js';
export { usePagination } from '../utils/pagination.js';


/**
 * Windowed page numbers — always first and last, the current page and its
 * neighbours, and an ellipsis for whatever it skipped. Keeps the control a
 * fixed width no matter how many pages there are.
 */
function pageWindow(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return sorted.reduce((acc, p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) acc.push('…');
    acc.push(p);
    return acc;
  }, []);
}

export default function Pagination({ page, pageCount, onChange, total, pageSize = PAGE_SIZE }) {
  if (pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = total ? Math.min(page * pageSize, total) : page * pageSize;

  return (
    <div className="pagination-bar no-print">
      <span className="text-muted small">
        {total
          ? <>Showing <strong className="text-body">{from}–{to}</strong> of <strong className="text-body">{total}</strong></>
          : <>Page <strong className="text-body">{page}</strong> of <strong className="text-body">{pageCount}</strong></>}
      </span>
      <div className="btn-group btn-group-sm">
        <button type="button" className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <i className="bi bi-chevron-left"></i>
        </button>
        {pageWindow(page, pageCount).map((p, i) =>
          p === '…' ? (
            <button type="button" key={`gap-${i}`} className="btn btn-outline-secondary disabled" tabIndex={-1}>…</button>
          ) : (
            <button
              type="button"
              key={p}
              className={`btn btn-outline-secondary${p === page ? ' active' : ''}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className="btn btn-outline-secondary" disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Next page">
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}
