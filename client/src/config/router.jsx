import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { GuestOnly, SessionRoot } from "../components/Session.jsx";
import AppShell from "../components/AppShell.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import VerifyEmail from "../pages/VerifyEmail.jsx";
import Matches from "../pages/Matches.jsx";
import Match from "../pages/Match.jsx";
import NotFound from "../pages/NotFound.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<SessionRoot />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* for visitors who are not logged in */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<AppShell />}>
        {/* open to everyone */}
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:id" element={<Match />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default router;
