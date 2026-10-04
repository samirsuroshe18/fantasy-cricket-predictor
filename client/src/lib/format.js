const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// how long until a match starts: "2d 4h", "5h 12m", "12m"; "Started" once it has
export const startsIn = (startsAt, now = Date.now()) => {
  const left = new Date(startsAt).getTime() - now;
  if (!(left > 0)) return 'Started';

  const days = Math.floor(left / DAY_MS);
  const hours = Math.floor((left % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((left % HOUR_MS) / MINUTE_MS);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)}m`;
};

// "Tue, 6 Oct, 7:30 pm" in the visitor's own time
export const dateTimeLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

export const FORMAT_NAMES = { t20: 'T20', odi: 'ODI' };

export const ROLES = [
  { key: 'wk', short: 'WK', name: 'Wicket-keeper', plural: 'Wicket-keepers' },
  { key: 'bat', short: 'BAT', name: 'Batter', plural: 'Batters' },
  { key: 'ar', short: 'AR', name: 'All-rounder', plural: 'All-rounders' },
  { key: 'bowl', short: 'BOWL', name: 'Bowler', plural: 'Bowlers' },
];

export const roleOf = (key) => ROLES.find((role) => role.key === key) || ROLES[1];

// "Rohan Deshpande" is RD
export const initialsOf = (name) => String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('');

// 31.4 stays, 30 loses its decimal
export const figure = (value) => (Number.isFinite(value) ? String(Math.round(value * 10) / 10) : '-');
