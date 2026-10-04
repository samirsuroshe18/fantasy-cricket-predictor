import { useCallback, useEffect, useState } from 'react';
import MatchCard from '../components/MatchCard';
import { Empty, Failed, Loading, Note } from '../components/States';
import { getMatches } from '../api/matchApi';
import { errorMessage } from '../api/client';

const MINUTE_MS = 60 * 1000;

const Matches = () => {
  // null while loading; { matches, live } once loaded
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  // moves once a minute, so the countdowns stay right while the page is open
  const [now, setNow] = useState(Date.now());

  const load = useCallback(() => {
    setError('');
    setData(null);
    getMatches().then(setData).catch((failure) => setError(errorMessage(failure)));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), MINUTE_MS);
    return () => clearInterval(timer);
  }, []);

  if (error) return <Failed message={error} onRetry={load} />;
  if (!data) return <Loading label="Loading matches…" />;

  // a match that started while the page was open is no longer one to predict
  const upcoming = data.matches.filter((match) => new Date(match.startsAt).getTime() > now);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Upcoming matches</h1>
        <p className="text-gray-600 mt-1">T20 and one-day matches that start within a week. Pick one to see its squads.</p>
      </div>

      {data.live.note && <Note>{data.live.note}</Note>}

      {upcoming.length === 0
        ? <Empty>No upcoming matches right now. Please check again later.</Empty>
        : upcoming.map((match) => <MatchCard key={match.id} match={match} now={now} />)}
    </div>
  );
};

export default Matches;
