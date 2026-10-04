import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Pitch from '../components/Pitch';
import Explanation from '../components/Explanation';
import TeamEditor from '../components/TeamEditor';
import { EditedBadge } from './Teams';
import { FormatBadge, SampleBadge } from '../components/MatchCard';
import { Empty, Failed, Loading } from '../components/States';
import { deleteTeam, getTeam, updateTeam } from '../api/teamApi';
import { errorMessage, statusOf } from '../api/client';
import useToast from '../lib/useToast';
import { dateTimeLabel, figure } from '../lib/format';

const NAME_MAX = 60;

const Team = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [team, setTeam] = useState(null);
  const [error, setError] = useState(null);
  // "", "rename" or "edit"
  const [mode, setMode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    setTeam(null);
    getTeam(id).then(setTeam).catch((failure) => setError({ message: errorMessage(failure), missing: statusOf(failure) === 404 }));
  }, [id]);

  useEffect(load, [load]);

  const back = <Link to="/teams" className="text-sm text-emerald-700 hover:underline">← My teams</Link>;

  if (error?.missing) return <div className="space-y-4">{back}<Empty>This team does not exist. It may have been deleted.</Empty></div>;
  if (error) return <Failed message={error.message} onRetry={load} />;
  if (!team) return <Loading label="Loading the team…" />;

  const change = async (changes, done) => {
    setBusy(true);
    try {
      setTeam(await updateTeam(team._id, changes));
      setMode('');
      toast.success(done);
    } catch (failure) {
      toast.error(failure);
    } finally {
      setBusy(false);
    }
  };

  const rename = (event) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error('Give the team a name');
      return;
    }

    change({ name }, 'Team renamed');
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${team.name}"? This cannot be undone.`)) return;

    setBusy(true);
    try {
      await deleteTeam(team._id);
      toast.success('Team deleted');
      navigate('/teams');
    } catch (failure) {
      toast.error(failure);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {back}

      <header className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <FormatBadge format={team.match.format} />
          {team.match.isSample && <SampleBadge />}
          {team.isEdited && <EditedBadge />}
          <span className="text-sm text-gray-500">Match: {dateTimeLabel(team.match.startsAt)}</span>
        </div>

        {mode === 'rename' ? (
          <form onSubmit={rename} className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[12rem]">
              <label htmlFor="team-name" className="label">Name</label>
              <input id="team-name" className="field" maxLength={NAME_MAX} value={name} onChange={(event) => setName(event.target.value)} autoFocus />
            </div>
            <button type="submit" className="btn-primary" disabled={busy}>Save name</button>
            <button type="button" className="btn-quiet" onClick={() => setMode('')} disabled={busy}>Cancel</button>
          </form>
        ) : (
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{team.name}</h1>
        )}

        <p className="text-gray-600 mt-1 break-words">{team.match.name}</p>
        <p className="text-sm text-gray-500 mt-2">Total score {figure(team.total)} · saved {dateTimeLabel(team.createdAt)}</p>

        {mode === '' && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn-primary" onClick={() => setMode('edit')} disabled={busy}>Change the team</button>
            <button className="btn-quiet" onClick={() => { setName(team.name); setMode('rename'); }} disabled={busy}>Rename</button>
            <button className="btn-danger" onClick={remove} disabled={busy}>Delete</button>
          </div>
        )}
      </header>

      {mode === 'edit' ? (
        <TeamEditor
          squads={team.squads}
          teams={team.match.teams}
          initial={{ playerIds: team.players.map((player) => player.id), captainId: team.captainId, viceCaptainId: team.viceCaptainId }}
          saving={busy}
          onSave={(changes) => change(changes, 'Team updated')}
          onCancel={() => setMode('')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          <div className="lg:col-span-3 min-w-0">
            <Pitch players={team.players} captainId={team.captainId} viceCaptainId={team.viceCaptainId} teams={team.match.teams} />
          </div>
          <div className="lg:col-span-2 min-w-0 space-y-4">
            {team.explanation
              ? <Explanation explanation={team.explanation} />
              : (
                <section className="card p-4 sm:p-5 text-sm text-gray-600">
                  {team.isEdited
                    ? 'This team was changed by hand, so it has no written explanation.'
                    : 'This team is the suggested eleven. It was saved without a written explanation.'}
                </section>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
