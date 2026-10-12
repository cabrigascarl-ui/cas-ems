import { actionMeta } from '../constants.js';
import { relativeTime, dayBucket } from '../utils/time.js';

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'S';
}

/**
 * The audit trail as a timeline rather than a four-column table. An audit log is
 * read as a narrative — who did what, how long ago — so the action gets an icon
 * and a plain-English label, and the timestamp is relative with the exact value
 * kept on hover.
 *
 * `grouped` adds Today / Yesterday / date headings; the dashboard's short
 * preview leaves it off.
 */
export default function ActivityFeed({ logs, grouped = false }) {
  if (!logs.length) return null;

  let lastBucket = null;

  return (
    <ol className="timeline">
      {logs.map((log) => {
        const meta = actionMeta(log.action);
        const bucket = dayBucket(log.createdAt);
        const showBucket = grouped && bucket !== lastBucket;
        lastBucket = bucket;

        return (
          <li key={log.id} className="timeline-item">
            {showBucket && <div className="timeline-bucket">{bucket}</div>}
            <div className="timeline-row">
              <span className={`timeline-dot tone-${meta.tone}`} aria-hidden="true">
                <i className={`bi ${meta.icon}`}></i>
              </span>
              <div className="timeline-body">
                <div className="timeline-head">
                  <span className="timeline-action">{meta.label}</span>
                  <time
                    className="timeline-time"
                    dateTime={log.createdAt}
                    title={log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                  >
                    {relativeTime(log.createdAt)}
                  </time>
                </div>
                {log.details && <div className="timeline-details">{log.details}</div>}
                <div className="timeline-actor">
                  <span className="actor-chip">{initials(log.userName || 'System')}</span>
                  {log.userName || 'System'}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
