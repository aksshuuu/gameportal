import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", form);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      window.dispatchEvent(new Event("gameportal-auth-change"));
      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-width auth-page">
      <div className="auth-card">
        <p className="eyebrow"><span className="eyebrow-line" /> PLAYER ACCOUNT</p>
        <div className="auth-header">
          <h1>Welcome back.</h1>
          <p>Players and organizers use the same sign-in. Your account type is set at registration.</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

        </form>

        <div className="auth-footer">
          <span>New to GamePortal?</span>
          <Link to="/register">Create an account</Link>
        </div>

        <Link className="auth-back" to="/">
          ← Back to GamePortal
        </Link>

      </div>
    </div>
  );
}