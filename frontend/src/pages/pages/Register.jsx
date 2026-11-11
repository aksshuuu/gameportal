import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("player");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", {
        username,
        email,
        password,
        role,
      });

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      window.dispatchEvent(new Event("gameportal-auth-change"));
      navigate("/dashboard");

    } catch (error) {

      setError(
        error.response?.data?.message ||
          error.message ||
          "Registration failed. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="content-width auth-page">
      <div className="auth-card">
        <p className="eyebrow"><span className="eyebrow-line" /> JOIN GAMEPORTAL</p>
        <h1>Create your account.</h1>

        <p className="auth-subtitle">
          Choose how you want to take part.
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <fieldset className="role-choice">
            <legend>Account type</legend>
            <label className={`role-option${role === "player" ? " is-selected" : ""}`}>
              <input type="radio" name="role" value="player" checked={role === "player"} onChange={() => setRole("player")} />
              <span><strong>Player</strong><small>Join tournaments and follow your activity.</small></span>
            </label>
            <label className={`role-option${role === "organizer" ? " is-selected" : ""}`}>
              <input type="radio" name="role" value="organizer" checked={role === "organizer"} onChange={() => setRole("organizer")} />
              <span><strong>Organizer</strong><small>Publish and manage your tournaments.</small></span>
            </label>
          </fieldset>

          <label htmlFor="register-username">Display name</label>
          <input
            id="register-username"
            type="text"
            placeholder="Enter username"
            autoComplete="username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            required
          />


          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            type="email"
            placeholder="Enter email"
            autoComplete="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />


          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            minLength={6}
            required
          />


          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
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

export default Register;