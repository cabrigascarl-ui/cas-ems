const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Short relative time for activity feeds — "just now", "12m ago", "3h ago",
 * "2d ago", then an absolute date once it's older than a week (at which point
 * "37d ago" stops meaning anything to a reader).
 */
export function relativeTime(iso) {
  if (!iso) return '—';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '—';

  const diff = Date.now() - then.getTime();
  if (diff < 0) return 'just now';
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Calendar bucket used to group a feed into "Today" / "Yesterday" / a date. */
export function dayBucket(iso) {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday - new Date(d).setHours(0, 0, 0, 0)) / DAY);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

/** "Good morning" / "Good afternoon" / "Good evening" for the dashboard greeting. */
export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
