import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// THIS IS THE MISSING LINE THAT FIXES THE DESIGN:
import "./App.css"; 

// Global Background Effect
import BackgroundEmbers from "./components/BackgroundEmbers";

import SiteLayout from "./components/SiteLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tournaments from "./pages/Tournaments";
import Teams from "./pages/Teams";
import Matches from "./pages/Matches";
import Leaderboard from "./pages/Leaderboard";
import Results from "./pages/Results";
import OAuthCallback from "./pages/OAuthCallback"; 

export default function App() {
  return (
    <Router>
      {/* Live background effect that sits behind everything */}
      <BackgroundEmbers />

      <Routes>
        <Route path="/" element={<SiteLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="teams" element={<Teams />} />
          <Route path="matches" element={<Matches />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="results" element={<Results />} />
          <Route path="oauth-callback" element={<OAuthCallback />} /> 
        </Route>
      </Routes>
    </Router>
  );
}