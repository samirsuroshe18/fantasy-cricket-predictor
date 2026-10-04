import { Link } from 'react-router-dom';
import TeamBadge from './TeamBadge';
import { FORMAT_NAMES, dateTimeLabel, startsIn } from '../lib/format';

export const SampleBadge = () => (
  <span className="text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 rounded px-2 py-0.5">Sample</span>
);

export const FormatBadge = ({ format }) => (
  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 rounded px-2 py-0.5">{FORMAT_NAMES[format] || format}</span>
);

// one upcoming match in the list
const MatchCard = ({ match, now }) => {
  const [home, away] = match.teams;

  return (
    <article className="card overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4 sm:p-6 bg-gray-50">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 min-w-0 text-center sm:text-left">
          <TeamBadge team={home} />
          <span className="font-semibold text-gray-700 break-words min-w-0">{home.name}</span>
        </div>
        <div className="text-center px-1">
          <span className="text-gray-500 text-xs sm:text-sm block">Starts in</span>
          <span className="text-gray-800 text-lg sm:text-xl font-bold whitespace-nowrap">{startsIn(match.startsAt, now)}</span>
        </div>
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-4 min-w-0 text-center sm:text-right">
          <span className="font-semibold text-gray-700 break-words min-w-0">{away.name}</span>
          <TeamBadge team={away} />
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 min-w-0">
          <FormatBadge format={match.format} />
          {match.isSample && <SampleBadge />}
          <span>{dateTimeLabel(match.startsAt)}</span>
          {match.venue && <span className="hidden sm:inline truncate">· {match.venue}</span>}
        </div>
        <Link to={`/matches/${match.id}`} className="btn-primary">View squads</Link>
      </div>
    </article>
  );
};

export default MatchCard;
