
import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useLoginMutation } from "../services/apiSlice";

// Use Render backend in production
// and localhost during local development.
const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://gameportal-backend.onrender.com/api"
    : "http://localhost:5000/api")
).replace(/\/+$/, "");

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [login, { isLoading }] = useLoginMutation();

  // Display Discord-related errors
  const discordError = searchParams.get("error");

  const [errorMsg, setErrorMsg] = useState(
    discordError === "discord_failed"
      ? "Discord login failed. Please try again."
      : discordError === "discord_link_required"
      ? "This email already has a GamePortal account. Log in with your password. Discord account linking is not available yet."
      : ""
  );

  // EMAIL / PASSWORD LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      // Store authentication details
      localStorage.setItem("token", response.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.user)
      );

      // Update navbar and other components
      window.dispatchEvent(
        new Event("gameportal-auth-change")
      );

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      setErrorMsg(
        err.data?.message ||
        (err.status === "FETCH_ERROR"
          ? "Cannot connect to the server. Please try again."
          : "Login failed. Please try again.")
      );
    }
  };

  return (
    <div className="content-width auth-page">
      <div className="auth-card">

        <p className="eyebrow">
          <span className="eyebrow-line" />
          WELCOME BACK
        </p>

        <h1>Log in to your account.</h1>

        {/* DISCORD LOGIN */}
        <div
          className="oauth-section"
          style={{
            marginBottom: "2rem",
            marginTop: "1.5rem",
          }}
        >
          <a
            href={`${API_URL}/auth/discord`}
            className="button"
            style={{
              width: "100%",
              backgroundColor: "#5865F2",
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              border: "none",
            }}
          >
            Log in with Discord
          </a>

          <div
            style={{
              textAlign: "center",
              margin: "1.5rem 0",
              color: "#888",
              fontSize: "0.9rem",
              fontWeight: "bold",
            }}
          >
            — OR LOG IN WITH EMAIL —
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {errorMsg && (
          <div
            className="auth-error"
            role="alert"
          >
            {errorMsg}
          </div>
        )}

        {/* EMAIL LOGIN FORM */}
        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">
            Email address
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="Enter email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="login-password">
            Password
          </label>

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
