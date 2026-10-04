import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { resendVerification } from '../api/authApi';
import useToast from '../lib/useToast';

// what an account sees until its address is verified
const VerifyBanner = () => {
  const toast = useToast();
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      const res = await resendVerification();
      toast.success(res.message);
    } catch (error) {
      toast.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm" role="status">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>Verify your email to predict and save teams. The link was sent to your address.</span>
        <button onClick={resend} disabled={sending} className="font-semibold underline disabled:opacity-50">
          {sending ? 'Sending…' : 'Send the link again'}
        </button>
      </div>
    </div>
  );
};

const DemoBanner = () => (
  <div className="bg-cyan-50 border-b border-cyan-200 text-cyan-900 text-sm" role="status">
    <div className="max-w-6xl mx-auto px-4 py-2">
      You are in the demo account. Try anything: it is shared with other visitors and put back to its starting state regularly.
    </div>
  </div>
);

// the frame of the pages of the app, with or without a login
const AppShell = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {user?.isDemo && <DemoBanner />}
      {user && !user.isVerified && <VerifyBanner />}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppShell;
