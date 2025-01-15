import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home"
import LandingPage from './pages/LandingPage'

function App() {


  return (
    <Router>
      <div className="flex">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/landingPage" element={<LandingPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App
