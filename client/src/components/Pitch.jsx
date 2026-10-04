import { Avatar } from './PlayerRow';
import { ROLES, figure } from '../lib/format';

const Mark = ({ children, title }) => (
  <span title={title} className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">
    {children}
  </span>
);

const Chip = ({ player, shortName, isCaptain, isVice }) => (
  <li className="w-[4.75rem] sm:w-24 flex flex-col items-center text-center">
    <span className="relative">
      <Avatar player={player} className="w-11 h-11 sm:w-12 sm:h-12 text-xs ring-2 ring-white" />
      {isCaptain && <Mark title="Captain">C</Mark>}
      {isVice && <Mark title="Vice-captain">VC</Mark>}
    </span>
    <span className="mt-1 w-full bg-white/95 rounded px-1 py-0.5 text-[11px] sm:text-xs font-semibold text-gray-800 leading-tight break-words">{player.name}</span>
    <span className="mt-0.5 text-[11px] text-white font-medium">{shortName} · {figure(player.score)}</span>
  </li>
);

// the eleven laid out by role, as on a fantasy pitch
const Pitch = ({ players, captainId, viceCaptainId, teams }) => {
  const shortNames = Object.fromEntries(teams.map((team) => [team.name, team.shortName]));

  return (
    <div className="rounded-lg bg-gradient-to-b from-emerald-600 to-green-700 px-2 py-4 sm:p-6 space-y-4">
      {ROLES.map((role) => {
        const ofRole = players.filter((player) => player.role === role.key);
        if (!ofRole.length) return null;

        return (
          <section key={role.key} aria-label={role.plural}>
            <h3 className="text-center text-[11px] uppercase tracking-widest text-emerald-100 mb-2">{role.plural}</h3>
            <ul className="flex flex-wrap justify-center gap-x-2 gap-y-3 sm:gap-x-4">
              {ofRole.map((player) => (
                <Chip
                  key={player.id}
                  player={player}
                  shortName={shortNames[player.team] || ''}
                  isCaptain={player.id === captainId}
                  isVice={player.id === viceCaptainId}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

export default Pitch;
