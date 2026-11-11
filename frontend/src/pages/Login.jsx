import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLoginMutation } from "../services/apiSlice";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  
  // Check if Discord redirected back with an error
  const [errorMsg, setErrorMsg] = useState(
    searchParams.get("error") === "discord_failed" 
      ? "Discord login failed. Please try again." 
      : ""
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await login({ email, password }).unwrap();
      
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      window.dispatchEvent(new Event("gameportal-auth-change"));
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="content-width auth-page">
      <div className="auth-card">
        <p className="eyebrow"><span className="eyebrow-line" /> WELCOME BACK</p>
        <h1>Log in to your account.</h1>

        {/* NEW DISCORD BUTTON SECTION */}
        <div className="oauth-section" style={{ marginBottom: '2rem', marginTop: '1.5rem' }}>
          <a 
            href="http://localhost:5000/api/auth/discord" 
            className="button" 
            style={{ width: '100%', backgroundColor: '#5865F2', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', border: 'none' }}
          >
            Log in with Discord
          </a>
          <div style={{ textAlign: 'center', margin: '1.5rem 0', color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>
            — OR LOG IN WITH EMAIL —
          </div>
        </div>

        {errorMsg && (
          <div className="auth-error">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            placeholder="Enter email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="auth-submit"
            disabled={isLoading}
          >
            {isLoading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account?</span>
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}