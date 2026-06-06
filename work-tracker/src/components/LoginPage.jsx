import { useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * LoginPage — handles agent authentication using Casper ID and Password.
 */
export default function LoginPage({ onLogin }) {
  const [casperId, setCasperId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: sbError } = await supabase
        .from("agents")
        .select("name, password, rate_amount")
        .eq("casper_id", casperId)
        .single();

      if (sbError) {
        if (sbError.code === "PGRST116") {
          throw new Error("Invalid Casper ID");
        }
        throw sbError;
      }

      if (data.password !== password) {
        throw new Error("Incorrect password");
      }

      // Success
      onLogin(data.name, casperId, data.rate_amount);
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="agent-picker-overlay">
      <div className="agent-picker-card">
        <div className="agent-picker-header">
          <div className="app-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto" }}>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
          <h1 className="agent-picker-title">Work Tracker</h1>
          <p className="agent-picker-subtitle">Please login to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="search-wrap" style={{ marginBottom: "16px" }}>
            <span className="search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <input
              className="search-input"
              type="text"
              placeholder="Casper ID"
              value={casperId}
              onChange={(e) => setCasperId(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="search-wrap" style={{ marginBottom: "24px" }}>
            <span className="search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <input
              className="search-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="agent-error" style={{ marginBottom: "16px" }}>{error}</div>}

          <button
            type="submit"
            className="agent-row login-submit-btn"
            disabled={loading}
            style={{ justifyContent: "center", background: "var(--primary)", color: "white", border: "none" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
