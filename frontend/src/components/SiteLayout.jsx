
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import api from "../services/api";

export default function SiteLayout() {
  const navigate = useNavigate();

  // Track authentication
  const [authStatus, setAuthStatus] = useState(
    () => localStorage.getItem("token")
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  });

  // Prevent older requests from overwriting a newer login
  const requestId = useRef(0);

  useEffect(() => {
    let active = true;

    const syncAuth = async () => {
      const currentRequest = ++requestId.current;
      const token = localStorage.getItem("token");

      setAuthStatus(token);

      // No token means logged out
      if (!token) {
        setUser(null);
        return;
      }

      // Only show a cached profile when it belongs
      // to the same token already being displayed.
      // Otherwise fetch the authenticated profile.
      setUser(null);

      try {
        const response = await api.get("/auth/me");

        // Ignore outdated requests and account switches
        if (
          !active ||
          currentRequest !== requestId.current ||
          localStorage.getItem("token") !== token
        ) {
          return;
        }

        setUser(response.data);

        localStorage.setItem(
          "user",
          JSON.stringify(response.data)
        );
      } catch (error) {
        if (
          !active ||
          currentRequest !== requestId.current ||
          localStorage.getItem("token") !== token
        ) {
          return;
        }

        console.error(
          "Failed to synchronize authentication:",
          error
        );

        // Only log out when the token is invalid
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          setAuthStatus(null);
          setUser(null);
        }
      }
    };

    // Initial page load
    syncAuth();

    // After email login, registration or Discord login
    window.addEventListener(
      "gameportal-auth-change",
      syncAuth
    );

    // Synchronize other browser tabs
    const handleStorage = (event) => {
      if (
        event.key === "token" ||
        event.key === null
      ) {
        syncAuth();
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      active = false;
      requestId.current++;

      window.removeEventListener(
        "gameportal-auth-change",
        syncAuth
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  // Logout
  const handleLogout = () => {
    requestId.current++;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setAuthStatus(null);

    window.dispatchEvent(
      new Event("gameportal-auth-change")
    );

    navigate("/");
  };

  return (
    <div className="site-layout">
      <header className="site-header">
        <div
          className="content-width header-inner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Link to="/" className="site-logo">
            <strong>GAMEPORTAL</strong>
            <span style={{ color: "#ff6600" }}>.</span>
          </Link>

          {/* Existing navigation */}
          <nav
            className="site-nav nav-links"
            style={{
              display: "flex",
              gap: "2rem",
              alignItems: "center",
              margin: "0 auto",
            }}
          >
            <Link to="/">Home</Link>
            <Link to="/tournaments">Tournaments</Link>
            <Link to="/matches">Matches</Link>
            <Link to="/leaderboard">Leaderboard</Link>

            {authStatus && (
              <Link to="/dashboard">
                {user?.role === "organizer"
                  ? "Organizer"
                  : "Player"}
              </Link>
            )}
          </nav>

          {/* Authentication buttons */}
          <div className="header-account">
            {authStatus ? (
              <button
                onClick={handleLogout}
                className="button button-outline button-small"
                type="button"
              >
                Logout
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                }}
              >
                <Link
                  to="/login"
                  className="button button-outline button-small"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="button button-small"
                >
                  Register
                </Link>
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
          <p>
            © {new Date().getFullYear()} GamePortal.
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}