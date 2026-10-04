import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../api/authApi';
import { loggedOut } from '../redux/slices/authSlice';
import useToast from '../lib/useToast';
import logo from '../assets/cricket.jpg';

// "loggedIn" links are shown to a logged-in user only
const LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Matches', href: '/matches' },
  { name: 'My teams', href: '/teams', loggedIn: true },
];

const linkClass = ({ isActive }) =>
  `${isActive ? 'text-emerald-950 underline underline-offset-4' : 'text-white'} font-medium hover:text-emerald-950 transition-colors`;

const Navbar = () => {
  const { status, user } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const isIn = status === 'in';
  const links = LINKS.filter((link) => !link.loggedIn || isIn);
  const close = () => setIsMenuOpen(false);

  const logoutUser = async () => {
    setLeaving(true);
    try {
      await logout();
    } catch {
      // the session may have ended already; the app logs out either way
    }
    dispatch(loggedOut());
    close();
    setLeaving(false);
    toast.success('Logged out');
    navigate('/');
  };

  const account = isIn ? (
    <>
      <span className="text-sm text-white truncate max-w-[12rem]" title={user.email}>{user.name}</span>
      <button className="btn bg-white text-green-700 hover:bg-emerald-50" onClick={logoutUser} disabled={leaving}>Logout</button>
    </>
  ) : (
    <>
      <Link to="/login" onClick={close} className="btn text-white border border-white hover:bg-emerald-600">Login</Link>
      <Link to="/register" onClick={close} className="btn bg-white text-green-700 hover:bg-emerald-50">Sign up</Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-40 bg-emerald-500 text-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" onClick={close} className="flex items-center gap-2 min-w-0">
          <img src={logo} className="w-8 h-8 rounded-full shrink-0" alt="" />
          <span className="text-lg sm:text-xl font-bold truncate">Fantasy Cricket Predictor</span>
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((item) => (
            <li key={item.href}><NavLink to={item.href} end={item.href === '/'} className={linkClass}>{item.name}</NavLink></li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">{status !== 'checking' && account}</div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-emerald-400 px-4 py-3 space-y-3">
          <ul className="space-y-3">
            {links.map((item) => (
              <li key={item.href}><NavLink to={item.href} end={item.href === '/'} onClick={close} className={linkClass}>{item.name}</NavLink></li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">{status !== 'checking' && account}</div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
