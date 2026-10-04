import { useState } from 'react';
import { Avatar, RoleBadge } from './PlayerRow';
import { ROLE_RULES, SIDE_MAX, TEAM_SIZE, chosenOf, problemOf, totalOf } from '../lib/rules';
import { figure } from '../lib/format';

const byScore = (a, b) => b.score - a.score || a.name.localeCompare(b.name);

const Count = ({ label, value, ok }) => (
  <span className={`text-xs font-semibold rounded px-2 py-1 ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
    {label} {value}
  </span>
);

const markClass = (active) =>
  `w-9 h-8 rounded text-xs font-bold border ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`;

// Changing a team: players are put in and taken out, and a captain and a
// vice-captain are chosen. It can be saved once it keeps to every rule.
const TeamEditor = ({ squads, teams, initial, saving, onSave, onCancel }) => {
  const [playerIds, setPlayerIds] = useState(initial.playerIds);
  const [captainId, setCaptainId] = useState(initial.captainId);
  const [viceCaptainId, setViceCaptainId] = useState(initial.viceCaptainId);

  const team = { playerIds, captainId, viceCaptainId };
  const chosen = chosenOf(squads, playerIds);
  const problem = problemOf(squads, team);
  const count = (test) => chosen.filter(test).length;

  const toggle = (id) => {
    if (playerIds.includes(id)) {
      setPlayerIds(playerIds.filter((entry) => entry !== id));
      if (captainId === id) setCaptainId('');
      if (viceCaptainId === id) setViceCaptainId('');
    } else {
      setPlayerIds([...playerIds, id]);
    }
  };

  // a player who becomes captain stops being vice-captain, and the other way round
  const makeCaptain = (id) => {
    setCaptainId(id);
    if (viceCaptainId === id) setViceCaptainId('');
  };
  const makeVice = (id) => {
    setViceCaptainId(id);
    if (captainId === id) setCaptainId('');
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 sm:sticky sm:top-16 z-30 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Count label="Players" value={`${chosen.length}/${TEAM_SIZE}`} ok={chosen.length === TEAM_SIZE} />
          {ROLE_RULES.map((role) => {
            const value = count((player) => player.role === role.key);
            return <Count key={role.key} label={role.short} value={`${value} (${role.min}-${role.max})`} ok={value >= role.min && value <= role.max} />;
          })}
          {teams.map((side) => {
            const value = count((player) => player.team === side.name);
            return <Count key={side.name} label={side.shortName} value={`${value} (max ${SIDE_MAX})`} ok={value <= SIDE_MAX} />;
          })}
          <span className="text-sm text-gray-600 ml-auto">Total {figure(totalOf(chosen))}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className={`text-sm flex-1 min-w-[12rem] ${problem ? 'text-red-600' : 'text-emerald-700'}`} role="status">
            {problem || 'This team keeps to every rule.'}
          </p>
          <button className="btn-quiet" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(team)} disabled={saving || Boolean(problem)}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {squads.map((squad) => (
          <section key={squad.team} className="card p-4 min-w-0">
            <h3 className="font-semibold text-gray-800 pb-2 border-b border-gray-200">{squad.team}</h3>
            <ul className="divide-y divide-gray-100">
              {[...squad.players].sort(byScore).map((player) => {
                const isIn = playerIds.includes(player.id);

                return (
                  <li key={player.id} className={`flex items-center gap-2 sm:gap-3 py-2 ${isIn ? '' : 'opacity-70'}`}>
                    <label className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 accent-emerald-600 shrink-0" checked={isIn} onChange={() => toggle(player.id)} />
                      <Avatar player={player} className="w-9 h-9 text-xs hidden sm:flex" />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-gray-800 truncate">{player.name}</span>
                          <RoleBadge role={player.role} />
                        </span>
                        <span className="text-xs text-gray-500">Score {figure(player.score)}</span>
                      </span>
                    </label>
                    {isIn && (
                      <span className="flex items-center gap-1 shrink-0">
                        <button type="button" className={markClass(captainId === player.id)} aria-pressed={captainId === player.id} aria-label={`Make ${player.name} captain`} onClick={() => makeCaptain(player.id)}>C</button>
                        <button type="button" className={markClass(viceCaptainId === player.id)} aria-pressed={viceCaptainId === player.id} aria-label={`Make ${player.name} vice-captain`} onClick={() => makeVice(player.id)}>VC</button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
};

export default TeamEditor;
