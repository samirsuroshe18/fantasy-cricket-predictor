import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { checkResetLink, resetPassword } from '../api/authApi';
import { errorMessage } from '../api/client';

const MIN_PASSWORD = 8;

// the page the reset link in the email opens
const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  // "checking" until the server has said whether the link is still good
  const [link, setLink] = useState('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');

  useEffect(() => {
    let cancelled = false;

    checkResetLink(token)
      .then(() => { if (!cancelled) setLink('good'); })
      .catch((failure) => { if (!cancelled) setLink(errorMessage(failure)); });

    return () => { cancelled = true; };
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters`);
      return;
    }

    if (password !== confirm) {
      setError('The two passwords are not the same');
      return;
    }

    setBusy(true);
    try {
      const res = await resetPassword(token, password);
      setDone(res.message);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Set a new password">
      {link === 'checking' && <p className="text-center text-gray-500" role="status">Checking the link…</p>}

      {link !== 'checking' && link !== 'good' && (
        <>
          <p role="alert" className="text-center text-red-600">{link}</p>
          <Link to="/forgot-password" className="btn-primary w-full mt-6">Ask for a new link</Link>
        </>
      )}

      {link === 'good' && done && (
        <>
          <p className="text-center text-gray-700" role="status">{done}</p>
          <Link to="/login" className="btn-primary w-full mt-6">Go to login</Link>
        </>
      )}

      {link === 'good' && !done && (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="password" className="label">New password</label>
            <input id="password" type="password" autoComplete="new-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">At least {MIN_PASSWORD} characters.</p>
          </div>
          <div>
            <label htmlFor="confirm" className="label">New password again</label>
            <input id="confirm" type="password" autoComplete="new-password" className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Save the new password'}</button>
        </form>
      )}
    </AuthCard>
  );
};

export default ResetPassword;
