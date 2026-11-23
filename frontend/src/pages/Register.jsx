
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "../services/apiSlice";

// Backend URL for Discord registration
const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://gameportal-backend.onrender.com/api"
    : "http://localhost:5000/api")
).replace(/\/+$/, "");

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("player");

  const [registerUser, { isLoading }] = useRegisterMutation();
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 2) {
      setErrorMsg("Username must have at least 2 characters.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must have at least 8 characters.");
      return;
    }

    try {
      const response = await registerUser({
        username: cleanUsername,
        email: cleanEmail,
        password,
        role,
      }).unwrap();

      localStorage.setItem("token", response.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.user)
      );

      window.dispatchEvent(
        new Event("gameportal-auth-change")
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);

      setErrorMsg(
        error.data?.message ||
        (error.status === "FETCH_ERROR"
          ? "Cannot connect to the server. Check your internet connection."
          : "Registration failed. Please try again.")
      );
    }
  };

  return (
    <div className="content-width auth-page">
      <div className="auth-card">

        <p className="eyebrow">
          <span className="eyebrow-line" />
          JOIN GAMEPORTAL
        </p>

        <h1>Create your account.</h1>

        <p className="auth-subtitle">
          Choose how you want to take part.
        </p>

        {errorMsg && (
          <div className="auth-error" role="alert">
            {errorMsg}
          </div>
        )}

        {/* DISCORD REGISTRATION */}
        <a
          href={`${API_URL}/auth/discord`}
          className="discord-auth-button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            width: "100%",
            minHeight: "48px",
            marginBottom: "18px",
            background: "#5865F2",
            color: "#ffffff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "600"
          }}
        >
          Continue with Discord
        </a>

        <p
          className="auth-subtitle"
          style={{
            textAlign: "center",
            fontSize: "13px"
          }}
        >
          Discord creates a Player account.
          To register as an Organizer, use the form below.
        </p>

        <div
          style={{
            textAlign: "center",
            margin: "24px 0",
            color: "#888",
            fontSize: "12px",
            letterSpacing: "1px"
          }}
        >
          OR REGISTER WITH EMAIL
        </div>

        <form onSubmit={handleRegister}>

          <fieldset className="role-choice">
            <legend>Account type</legend>

            <label
              className={`role-option${
                role === "player" ? " is-selected" : ""
              }`}
            >
              <input
                type="radio"
                name="role"
                value="player"
                checked={role === "player"}
                onChange={() => setRole("player")}
              />
              <span>
                <strong>Player</strong>
                <small>
                  Join tournaments and follow your activity.
                </small>
              </span>
            </label>

            <label
              className={`role-option${
                role === "organizer" ? " is-selected" : ""
              }`}
            >
              <input
                type="radio"
                name="role"
                value="organizer"
                checked={role === "organizer"}
                onChange={() => setRole("organizer")}
              />
              <span>
                <strong>Organizer</strong>
                <small>
                  Publish and manage your tournaments.
                </small>
              </span>
            </label>
          </fieldset>

          <label htmlFor="register-username">
            Display name
          </label>

          <input
            id="register-username"
            type="text"
            placeholder="Enter username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={2}
            maxLength={40}
            required
          />

          <label htmlFor="register-email">
            Email address
          </label>

          <input
            id="register-email"
            type="email"
            placeholder="Enter email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="register-password">
            Password
          </label>

          <input
            id="register-password"
            type="password"
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          <button
            type="submit"
            className="auth-submit"
            disabled={isLoading}
          >
            {isLoading
              ? "Creating account…"
              : "Create account"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login">Sign in</Link>
        </div>

      </div>
    </div>
  );
}
