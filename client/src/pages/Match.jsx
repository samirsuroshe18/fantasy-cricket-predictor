import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TeamBadge from '../components/TeamBadge';
import PlayerRow from '../components/PlayerRow';
import { FormatBadge, SampleBadge } from '../components/MatchCard';
import { Empty, Failed, Loading, Note } from '../components/States';
import { getMatch } from '../api/matchApi';
import { errorMessage, statusOf } from '../api/client';
import { ROLES, dateTimeLabel, startsIn } from '../lib/format';

const FILTERS = [{ key: 'all', short: 'All' }, ...ROLES];

// the best first; players with the same score by name
const byScore = (a, b) => b.score - a.score || a.name.localeCompare(b.name);

const Squad = ({ team, players, filter, loaded }) => {
  const shown = players.filter((player) => filter === 'all' || player.role === filter).sort(byScore);

  return (
    <section className="card p-4 sm:p-5 min-w-0">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
        <TeamBadge team={team} size="sm" />
        <h2 className="text-lg font-semibold text-gray-800 min-w-0 break-words">{team.name}</h2>
        <span className="ml-auto text-sm text-gray-500 whitespace-nowrap">{players.length} players</span>
      </div>
      {shown.length === 0
        ? <p className="text-sm text-gray-500 py-6 text-center">{players.length ? 'No players of this kind.' : (loaded ? 'The squad is not announced yet.' : 'The squad could not be loaded.')}</p>
        : <ul className="divide-y divide-gray-100">{shown.map((player) => <PlayerRow key={player.id} player={player} />)}</ul>}
    </section>
  );
};

const Match = () => {
  const { id } = useParams();
  // null while loading; { match, squads, note } once loaded
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    setError(null);
    setData(null);
    getMatch(id).then(setData).catch((failure) => setError({ message: errorMessage(failure), missing: statusOf(failure) === 404 }));
  }, [id]);

  useEffect(load, [load]);

  if (error?.missing) {
    return (
      <Empty>
        <p>This match is not in the list of upcoming matches. It may have started already.</p>
        <Link to="/matches" className="btn-primary mt-4">Back to the matches</Link>
      </Empty>
    );
  }

  if (error) return <Failed message={error.message} onRetry={load} />;
  // the figures of a squad that is new to the server are fetched one player at a time
  if (!data) return <Loading label="Loading the squads…" />;

  const { match, squads, note } = data;
  const hasPlayers = squads.some((squad) => squad.players.length > 0);

  return (
    <div className="space-y-4">
      <Link to="/matches" className="text-sm text-emerald-700 hover:underline">← All matches</Link>

      <header className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <FormatBadge format={match.format} />
          {match.isSample && <SampleBadge />}
          <span className="text-sm text-gray-500">{dateTimeLabel(match.startsAt)} · {new Date(match.startsAt).getTime() > Date.now() ? `starts in ${startsIn(match.startsAt)}` : 'has started'}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{match.name}</h1>
        {match.venue && <p className="text-gray-600 mt-1">{match.venue}</p>}
        {match.isSample && <p className="text-sm text-gray-500 mt-2">A sample match: its teams, players and figures are made up, so the app can be tried at any time.</p>}
        {hasPlayers && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link to={`/matches/${match.id}/prediction`} className="btn-primary">Predict my eleven</Link>
            <span className="text-sm text-gray-500">The best team the rules allow, with a captain and a vice-captain. Needs an account.</span>
          </div>
        )}
      </header>

      {note && <Note>{note}</Note>}

      {hasPlayers && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Show players by role">
          {FILTERS.map((entry) => (
            <button
              key={entry.key}
              onClick={() => setFilter(entry.key)}
              aria-pressed={filter === entry.key}
              className={`btn ${filter === entry.key ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
            >
              {entry.short}
            </button>
          ))}
          <span className="text-xs text-gray-500 ml-auto">Score: 0 to 100, from career figures in this format</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {squads.map((squad, index) => (
          <Squad key={squad.team} team={match.teams[index]} players={squad.players} filter={filter} loaded={hasPlayers || !note} />
        ))}
      </div>
    </div>
  );
};

export default Match;
