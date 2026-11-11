import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

const links = [
  { to: "/tournaments", label: "Tournaments" },
  { to: "/teams", label: "Teams" },
  { to: "/matches", label: "Matches" },
  { to: "/results", label: "Results" },
  { to: "/leaderboard", label: "Leaderboard" },
];

export default function SiteLayout() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("token");
    if (!token) {
      return () => { active = false; };
    }

    api.get("/auth/me")
      .then(({ data }) => {
        if (!active) return;
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      });

    return () => { active = false; };
  }, [location.pathname]);

  useEffect(() => {
    const syncAuth = () => {
      const cached = localStorage.getItem("user");
      try {
        setUser(cached ? JSON.parse(cached) : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("gameportal-auth-change", syncAuth);
    return () => window.removeEventListener("gameportal-auth-change", syncAuth);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event("gameportal-auth-change"));
    navigate("/");
  };

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="GamePortal home" onClick={() => setMenuOpen(false)}>
            <span>GAMEPORTAL<span className="brand-period">.</span></span>
          </Link>
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
          </button>
          <nav id="primary-navigation" className={`primary-navigation${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
            <NavLink end to="/" onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>Overview</NavLink>
            {user && (
              <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>
                {user.role === "organizer" ? "Organizer" : "Dashboard"}
              </NavLink>
            )}
            {links.map(({ to, label }) => (
              <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>{label}</NavLink>
            ))}
          </nav>
          <div className="header-account">
            {user ? (
              <>
                <Link to="/dashboard" className="account-link">
                  <span className="account-name">{user.role === "organizer" ? "Organizer" : "Player"} · {user.username || "Account"}</span>
                </Link>
                <button className="button button-quiet header-logout" type="button" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <Link className="header-signin" to="/login">Sign in</Link>
                <Link className="button button-small" to="/register">Create account</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="main-content" className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <Link className="footer-brand" to="/">GAMEPORTAL<span className="brand-period">.</span></Link>
          <p>Competition, clearly.</p>
          <div className="footer-links">
            <Link to="/tournaments">Tournaments</Link>
            <Link to="/teams">Teams</Link>
            <Link to="/dashboard">Player dashboard</Link>
          </div>
          <span className="footer-note">© {new Date().getFullYear()} GamePortal</span>
        </div>
      </footer>
    </div>
  );
}
