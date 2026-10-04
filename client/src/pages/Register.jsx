import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { register } from '../api/authApi';
import { errorMessage } from '../api/client';

const MIN_PASSWORD = 8;

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, email and password are required');
      return;
    }

    if (form.password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters`);
      return;
    }

    if (form.password !== form.confirm) {
      setError('The two passwords are not the same');
      return;
    }

    setBusy(true);
    try {
      const res = await register({ name: form.name, email: form.email, password: form.password });
      setDone(res.message);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthCard title="Check your email">
        <p className="text-center text-gray-700" role="status">{done}</p>
        <p className="text-center text-sm text-gray-600 mt-3">The link is valid for 10 minutes. You can log in before you have used it.</p>
        <Link to="/login" className="btn-primary w-full mt-6">Go to login</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create an account">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" name="name" type="text" autoComplete="name" maxLength={80} className="field" value={form.name} onChange={change} />
        </div>
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" className="field" value={form.email} onChange={change} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" className="field" value={form.password} onChange={change} />
          <p className="text-xs text-gray-500 mt-1">At least {MIN_PASSWORD} characters.</p>
        </div>
        <div>
          <label htmlFor="confirm" className="label">Password again</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="field" value={form.confirm} onChange={change} />
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Creating…' : 'Create account'}</button>
      </form>

      <p className="text-center text-sm mt-6 text-gray-600">
        Already have an account? <Link to="/login" className="text-emerald-600 hover:underline">Login</Link>
      </p>
    </AuthCard>
  );
};

export default Register;
