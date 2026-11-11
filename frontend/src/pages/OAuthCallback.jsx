import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      // Save the token and trigger the login state update globally
      localStorage.setItem("token", token);
      window.dispatchEvent(new Event("gameportal-auth-change"));
      
      // Send the user directly to their dashboard
      navigate("/dashboard");
    } else {
      // If something went wrong, send them back to login with an error
      navigate("/login?error=discord_failed");
    }
  }, [token, navigate]);

  return (
    <div className="content-width page-content">
      <div className="feedback-state">
        <h2>Connecting to Discord...</h2>
        <p>Please wait while we set up your profile.</p>
      </div>
    </div>
  );
}