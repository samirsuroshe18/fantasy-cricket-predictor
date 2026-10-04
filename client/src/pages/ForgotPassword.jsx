import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { forgotPassword } from '../api/authApi';
import { errorMessage } from '../api/client';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setBusy(true);
    try {
      const res = await forgotPassword(email);
      setDone(res.message);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Forgot your password?">
      {done ? (
        <p className="text-center text-gray-700" role="status">{done}. The link is valid for 10 minutes.</p>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-sm text-gray-600">Enter the address of your account and we will send you a link to set a new password.</p>
          <div>
            <label htmlFor="email" className="label">Email address</label>
            <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Sending…' : 'Send the link'}</button>
        </form>
      )}

      <p className="text-center text-sm mt-6"><Link to="/login" className="text-emerald-600 hover:underline">Back to login</Link></p>
    </AuthCard>
  );
};

export default ForgotPassword;
