
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Read the token from the URL fragment (#token=...)
    const hashParams = new URLSearchParams(
      window.location.hash.substring(1)
    );

    const token = hashParams.get("token");

    if (!token) {
      // Discord authentication failed
      navigate("/login?error=discord_failed", {
        replace: true,
      });
      return;
    }

    // Save the new JWT token
    localStorage.setItem("token", token);

    // Remove any previous user's cached profile
    localStorage.removeItem("user");

    // Remove the token from the browser's address bar
    window.history.replaceState(
      null,
      "",
      "/oauth-callback"
    );

    // Notify the website that authentication changed
    window.dispatchEvent(
      new Event("gameportal-auth-change")
    );

    // Redirect to the player dashboard
    navigate("/dashboard", {
      replace: true,
    });
  }, [navigate]);

  return (
    <div className="content-width page-content">
      <div className="feedback-state">
        <h2>Connecting to Discord...</h2>
        <p>Please wait while we set up your profile.</p>
      </div>
    </div>
  );
}
