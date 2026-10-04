import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import AuthCard from '../components/AuthCard';
import { demoLogin, login } from '../api/authApi';
import { errorMessage } from '../api/client';
import { loggedIn } from '../redux/slices/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  // logging in changes the session; the guard around this page then sends the user on
  const enter = async (kind, request) => {
    setBusy(kind);
    setError('');
    try {
      const res = await request();
      dispatch(loggedIn(res.data.user));
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy('');
    }
  };

  const submit = (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }

    enter('login', () => login(email, password));
  };

  return (
    <AuthCard title="Login">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={Boolean(busy)} className="btn-primary w-full">
          {busy === 'login' ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600 mb-3">Just looking around?</p>
        <button onClick={() => enter('demo', demoLogin)} disabled={Boolean(busy)} className="btn-quiet w-full">
          {busy === 'demo' ? 'Opening the demo…' : 'Try the demo account'}
        </button>
      </div>

      <p className="text-center text-sm mt-6"><Link to="/forgot-password" className="text-emerald-600 hover:underline">Forgot your password?</Link></p>
      <p className="text-center text-sm mt-2 text-gray-600">
        No account yet? <Link to="/register" className="text-emerald-600 hover:underline">Sign up</Link>
      </p>
    </AuthCard>
  );
};

export default Login;
