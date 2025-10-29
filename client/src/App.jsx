import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard"
import LandingPage from './pages/LandingPage'
import Team from './pages/Team'
import Matches from './pages/Matches'
import { ApiCallProvider } from './Context/apiCount'

import Squad from './pages/Squad'
import Prediction from './pages/Prediction'

function App() {

  const [isApiCalled, setIsApiCalled] = useState(false);
  return (
    <ApiCallProvider value={{ isApiCalled, setIsApiCalled }}>
    <Router>
      <div className="flex">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/team/:matchId/:matchType" element={<Team />} />
            <Route path="/Team" element={<Team />} />
            <Route path="/Squad" element={<Squad/>} />
            <Route path="/prediction" element={<Prediction/>} />
          </Routes>
        </div>
      </div>
    </Router>
    </ApiCallProvider>
  );
}

export default App
