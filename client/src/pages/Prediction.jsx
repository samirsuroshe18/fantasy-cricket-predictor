import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Pitch from '../components/Pitch';
import Explanation from '../components/Explanation';
import PlayerRow from '../components/PlayerRow';
import { FormatBadge, SampleBadge } from '../components/MatchCard';
import { Empty, Failed, Loading, Note } from '../components/States';
import { predict, saveTeam } from '../api/teamApi';
import { errorMessage, statusOf } from '../api/client';
import useToast from '../lib/useToast';
import { dateTimeLabel, figure } from '../lib/format';

const NAME_MAX = 60;

const Prediction = () => {
  const { id } = useParams();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const toast = useToast();

  // null while loading; the prediction once loaded
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  // a prediction counts against the day's allowance, so it is asked for once
  const asked = useRef('');

  useEffect(() => {
    if (!user.isVerified || asked.current === id) return;
    asked.current = id;

    predict(id)
      .then((prediction) => {
        setData(prediction);
        setName(`${prediction.match.teams[0].shortName} v ${prediction.match.teams[1].shortName} eleven`);
      })
      .catch((failure) => setError({ message: errorMessage(failure), status: statusOf(failure) }));
  }, [id, user.isVerified]);

  const back = <Link to={`/matches/${id}`} className="text-sm text-emerald-700 hover:underline">← Back to the squads</Link>;

  if (!user.isVerified) {
    return (
      <div className="space-y-4">
        {back}
        <Empty>Verify your email to get a prediction. The link was sent to your address; you can send it again from the bar above.</Empty>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {back}
        {/* no team can be made, or the day's predictions are used up: trying again does not help */}
        {[404, 422, 429].includes(error.status) ? <Empty>{error.status === 404 ? 'This match is not in the list of upcoming matches. It may have started already.' : error.message}</Empty> : <Failed message={error.message} />}
      </div>
    );
  }

  if (!data) return <Loading label="Building your eleven…" />;

  const save = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error('Give the team a name');
      return;
    }

    setSaving(true);
    try {
      const team = await saveTeam({
        matchId: data.match.id,
        name,
        playerIds: data.players.map((player) => player.id),
        captainId: data.captainId,
        viceCaptainId: data.viceCaptainId,
      });
      toast.success('Team saved');
      navigate(`/teams/${team._id}`);
    } catch (failure) {
      toast.error(failure);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {back}

      <header className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <FormatBadge format={data.match.format} />
          {data.match.isSample && <SampleBadge />}
          <span className="text-sm text-gray-500">{dateTimeLabel(data.match.startsAt)}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">Suggested eleven</h1>
        <p className="text-gray-600 mt-1 break-words">{data.match.name}</p>
        <p className="text-sm text-gray-500 mt-2">
          Total score {figure(data.total)} · {data.remaining} prediction{data.remaining === 1 ? '' : 's'} left today
        </p>
      </header>

      {data.note && <Note>{data.note}</Note>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-3 space-y-4 min-w-0">
          <Pitch players={data.players} captainId={data.captainId} viceCaptainId={data.viceCaptainId} teams={data.match.teams} />
        </div>

        <div className="lg:col-span-2 space-y-4 min-w-0">
          <form onSubmit={save} className="card p-4 sm:p-5 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Save this team</h2>
            <div>
              <label htmlFor="team-name" className="label">Name</label>
              <input id="team-name" className="field" maxLength={NAME_MAX} value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? 'Saving…' : 'Save team'}</button>
            <p className="text-xs text-gray-500">A saved team can be changed afterwards: other players, another captain.</p>
          </form>

          {data.explanation
            ? <Explanation explanation={data.explanation} />
            : <Note>The written explanation is not available right now. The team itself is complete.</Note>}

          {data.bench.length > 0 && (
            <section className="card p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-gray-800">Best of those left out</h2>
              <ul className="divide-y divide-gray-100">{data.bench.map((player) => <PlayerRow key={player.id} player={player} />)}</ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prediction;
