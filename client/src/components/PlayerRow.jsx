import { useState } from 'react';
import { figure, initialsOf, roleOf } from '../lib/format';

const ROLE_STYLES = {
  wk: 'bg-purple-100 text-purple-800',
  bat: 'bg-sky-100 text-sky-800',
  ar: 'bg-amber-100 text-amber-800',
  bowl: 'bg-rose-100 text-rose-800',
};

export const RoleBadge = ({ role }) => (
  <span className={`text-[11px] font-semibold rounded px-1.5 py-0.5 ${ROLE_STYLES[role] || ROLE_STYLES.bat}`} title={roleOf(role).name}>
    {roleOf(role).short}
  </span>
);

export const Avatar = ({ player, className = 'w-10 h-10 text-xs' }) => {
  const [broken, setBroken] = useState(false);

  if (player.image && !broken) {
    return <img src={player.image} alt="" className={`${className} rounded-full object-cover bg-gray-100 shrink-0`} onError={() => setBroken(true)} referrerPolicy="no-referrer" loading="lazy" />;
  }

  return (
    <span className={`${className} rounded-full bg-gray-200 text-gray-600 font-semibold flex items-center justify-center shrink-0`} aria-hidden="true">
      {initialsOf(player.name)}
    </span>
  );
};

// the score from 0 to 100, as a number and a bar
export const ScoreBar = ({ score }) => (
  <div className="flex items-center gap-2" title="Score from 0 to 100">
    <div className="w-10 sm:w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden" aria-hidden="true">
      <div className="h-full bg-emerald-500" style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}></div>
    </div>
    <span className="text-sm font-bold text-gray-800 tabular-nums w-9 text-right">{figure(score)}</span>
  </div>
);

// "Bat 142 inn · avg 31.4 · SR 141.2"
const figuresLine = (player) => {
  if (!player.figuresLoaded) return 'Figures could not be loaded';
  if (!player.hasFigures) return 'No figures available';

  const { batting, bowling } = player.figures;
  const parts = [];
  if (batting) parts.push(`Bat ${batting.innings} inn · avg ${figure(batting.average)} · SR ${figure(batting.strikeRate)}`);
  if (bowling) parts.push(`Bowl ${bowling.innings} inn · ${bowling.wickets} wkts · econ ${figure(bowling.economy)}`);
  return parts.join('  |  ');
};

// one player of a squad, with role, career figures and score
const PlayerRow = ({ player }) => (
  <li className="flex items-center gap-3 py-2.5">
    <Avatar player={player} />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-gray-800 truncate">{player.name}</span>
        <RoleBadge role={player.role} />
      </div>
      <p className={`text-xs mt-0.5 break-words ${player.hasFigures ? 'text-gray-500' : 'text-gray-400 italic'}`}>{figuresLine(player)}</p>
    </div>
    <ScoreBar score={player.score} />
  </li>
);

export default PlayerRow;
