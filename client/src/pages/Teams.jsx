import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FormatBadge, SampleBadge } from '../components/MatchCard';
import { Empty, Failed, Loading } from '../components/States';
import { listTeams } from '../api/teamApi';
import { errorMessage } from '../api/client';
import { dateTimeLabel, figure } from '../lib/format';

export const EditedBadge = () => (
  <span className="text-xs font-semibold bg-gray-200 text-gray-700 rounded px-2 py-0.5">Edited</span>
);

const Teams = () => {
  // null while loading; { teams, limit } once loaded
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    setData(null);
    listTeams().then(setData).catch((failure) => setError(errorMessage(failure)));
  }, []);

  useEffect(load, [load]);

  if (error) return <Failed message={error} onRetry={load} />;
  if (!data) return <Loading label="Loading your teams…" />;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My teams</h1>
          <p className="text-gray-600 mt-1">{data.teams.length} of {data.limit} saved</p>
        </div>
        <Link to="/matches" className="btn-primary">Pick a match</Link>
      </div>

      {data.teams.length === 0 && (
        <Empty>You have not saved a team yet. Pick a match, get a suggested eleven and save it.</Empty>
      )}

      {data.teams.map((team) => (
        <Link key={team._id} to={`/teams/${team._id}`} className="card block p-4 sm:p-5 hover:border-emerald-400 transition">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <FormatBadge format={team.match.format} />
            {team.match.isSample && <SampleBadge />}
            {team.isEdited && <EditedBadge />}
            <span className="text-xs text-gray-500 ml-auto">Saved {dateTimeLabel(team.createdAt)}</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 break-words">{team.name}</h2>
          <p className="text-sm text-gray-600 break-words">{team.match.name}</p>
          <p className="text-sm text-gray-500 mt-2 break-words">
            Captain {team.captain} · Vice-captain {team.viceCaptain} · Total {figure(team.total)}
          </p>
        </Link>
      ))}
    </div>
  );
};

export default Teams;
