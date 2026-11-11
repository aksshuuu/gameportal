import { useEffect, useState } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import api from "../services/api";

export default function SiteLayout() {
  const navigate = useNavigate();
  
  // Track authentication and user object so we know if they are an organizer or player
  const [authStatus, setAuthStatus] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthStatus(localStorage.getItem("token"));
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setUser(null);
      }
    };
    
    window.addEventListener("gameportal-auth-change", handleAuthChange);
    return () => window.removeEventListener("gameportal-auth-change", handleAuthChange);
  }, []);

  // Fetch fresh profile data if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api.get("/auth/me")
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      })
      .catch(() => {
        // Silent catch or reset if invalid token
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setAuthStatus(null);
    window.dispatchEvent(new Event("gameportal-auth-change"));
    navigate("/");
  };

  return (
    <div className="site-layout">
      <header className="site-header">
        <div className="content-width header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Link to="/" className="site-logo">
            <strong>GAMEPORTAL</strong><span style={{ color: '#ff6600' }}>.</span>
          </Link>
          
          {/* All 5 required links clearly mapped out */}
          <nav className="site-nav nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center', margin: '0 auto' }}>
            <Link to="/">Home</Link>
            <Link to="/tournaments">Tournaments</Link>
            <Link to="/matches">Matches</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            
            {authStatus && (
              <Link to="/dashboard">
                {user?.role === "organizer" ? "Organizer" : "Player"}
              </Link>
            )}
          </nav>

          <div className="header-account">
            {authStatus ? (
              <button onClick={handleLogout} className="button button-outline button-small">
                Logout
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/login" className="button button-outline button-small">Log in</Link>
                <Link to="/register" className="button button-small">Register</Link>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="site-main">
        <Outlet />
      </main>
      
      <footer className="site-footer">
        <div className="content-width">
          <p>© {new Date().getFullYear()} GamePortal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}