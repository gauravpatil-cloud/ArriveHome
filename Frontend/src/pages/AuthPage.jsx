import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../apiClient.js";
import Notice from "../components/Notice.jsx";
import { messageFrom } from "../utils/errors.js";

export default function AuthPage({ signup = false, setUser, googleEnabled }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(() =>
    new URLSearchParams(location.search).has("googleError")
      ? "Google sign-in could not be completed. Please try again."
      : "",
  );
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api(`/auth/${signup ? "signup" : "login"}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      setUser(result.user);
      navigate("/");
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">
          {signup ? "Make room for more" : "Good to see you again"}
        </p>
        <h1>{signup ? "Join ArriveHome" : "Welcome back"}</h1>
        <p className="form-intro">
          {signup
            ? "Save stays and plan the trips you have been dreaming about."
            : "Sign in to book stays, leave reviews and host your place."}
        </p>
        {error && <Notice tone="error">{error}</Notice>}
        <form className="property-form" onSubmit={submit}>
          {signup && (
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
          )}
          <label>
            Username
            <input
              name="username"
              autoComplete="username"
              minLength={signup ? 3 : undefined}
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={signup ? 8 : undefined}
              required
            />
          </label>
          <button className="button button-primary form-submit" disabled={busy}>
            {busy ? "One moment…" : signup ? "Create account" : "Log in"}
          </button>
        </form>
        {googleEnabled && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>
            <a className="google-button" href="/api/auth/google">
              <span aria-hidden="true">G</span>Continue with Google
            </a>
          </>
        )}
        <p className="auth-switch">
          {signup ? "Already have an account?" : "New to ArriveHome?"}{" "}
          <Link to={signup ? "/login" : "/signup"}>
            {signup ? "Log in" : "Create an account"}
          </Link>
        </p>
      </div>
    </section>
  );
}
