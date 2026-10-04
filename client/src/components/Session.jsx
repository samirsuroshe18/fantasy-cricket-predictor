import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getMe } from '../api/authApi';
import { setSessionEndedHandler } from '../api/client';
import { loggedIn, loggedOut } from '../redux/slices/authSlice';
import Toast from './Toast';

const Checking = () => (
  <div className="min-h-screen flex items-center justify-center" role="status">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent" aria-hidden="true"></div>
    <span className="sr-only">Loading…</span>
  </div>
);

// Wraps every page: asks the server once who is logged in, and logs the app out when
// the server stops accepting the session.
export const SessionRoot = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    setSessionEndedHandler(() => dispatch(loggedOut()));

    getMe()
      .then((user) => dispatch(loggedIn(user)))
      .catch(() => dispatch(loggedOut()));
  }, [dispatch]);

  return (
    <>
      <Toast />
      <Outlet />
    </>
  );
};

// pages that need a login; a visitor is sent to the login page and back afterwards
export const RequireLogin = () => {
  const status = useSelector((state) => state.auth.status);
  const location = useLocation();

  if (status === 'checking') return <Checking />;

  if (status === 'out') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <Outlet />;
};

// login and sign-up: someone who is logged in already goes on to the app
export const GuestOnly = () => {
  const status = useSelector((state) => state.auth.status);
  const location = useLocation();

  if (status === 'checking') return <Checking />;

  if (status === 'in') {
    return <Navigate to={location.state?.from || '/matches'} replace />;
  }

  return <Outlet />;
};
