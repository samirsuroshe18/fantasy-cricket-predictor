import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AuthCard from '../components/AuthCard';
import { getMe, verifyEmail } from '../api/authApi';
import { errorMessage } from '../api/client';
import { loggedIn } from '../redux/slices/authSlice';

// the page the verification link in the email opens
const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const status = useSelector((state) => state.auth.status);
  const dispatch = useDispatch();

  // "checking", "done", or the reason the link was refused
  const [result, setResult] = useState('checking');
  // the link works once, so it is used once even if the page renders twice
  const used = useRef(false);

  useEffect(() => {
    if (used.current) return;
    used.current = true;

    verifyEmail(token)
      .then(async () => {
        setResult('done');
        // someone who is logged in sees the change straight away
        const user = await getMe().catch(() => null);
        if (user) dispatch(loggedIn(user));
      })
      .catch((failure) => setResult(errorMessage(failure)));
  }, [token, dispatch]);

  return (
    <AuthCard title="Email verification">
      {result === 'checking' && <p className="text-center text-gray-500" role="status">Verifying your email…</p>}

      {result === 'done' && (
        <>
          <p className="text-center text-gray-700" role="status">Your email is verified. You can now predict and save teams.</p>
          <Link to={status === 'in' ? '/matches' : '/login'} className="btn-primary w-full mt-6">
            {status === 'in' ? 'Go to the matches' : 'Go to login'}
          </Link>
        </>
      )}

      {result !== 'checking' && result !== 'done' && (
        <>
          <p role="alert" className="text-center text-red-600">{result}</p>
          <p className="text-center text-sm text-gray-600 mt-3">Log in and use “Send the link again” to get a new one.</p>
          <Link to="/login" className="btn-primary w-full mt-6">Go to login</Link>
        </>
      )}
    </AuthCard>
  );
};

export default VerifyEmail;
