import { useState } from "react";
import { useAgentList } from "../hooks/useAgentList";

/**
 * AgentPicker — full-screen overlay shown on first visit.
 * Fetches agent names from GAS, lets user search and pick their name.
 */
export default function AgentPicker({ onSelect }) {
  const { agents, loading, error } = useAgentList();
  const [search, setSearch] = useState("");

  const filtered = agents.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="agent-picker-overlay">
      <div className="agent-picker-card">
        {/* Header */}
        <div className="agent-picker-header">
          <div className="app-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", margin: "0 auto" }}>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
          <h1 className="agent-picker-title">Work Tracker</h1>
          <p className="agent-picker-subtitle">Who are you today?</p>
        </div>

        {/* Search input */}
        <div className="search-wrap">
          <span className="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            className="search-input"
            type="text"
            placeholder="Search your name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Agent list */}
        <div className="agent-list">
          {loading && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="agent-skeleton shimmer" />
              ))}
            </>
          )}

          {error && (
            <div className="agent-error">
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Could not load agent list
              </span>
              <small>{error}</small>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="agent-empty">No agents found</div>
          )}

          {!loading &&
            filtered.map((name) => (
              <button
                key={name}
                className="agent-row"
                onClick={() => onSelect(name)}
              >
                <span className="agent-avatar">
                  {name.charAt(0).toUpperCase()}
                </span>
                <span className="agent-name">{name}</span>
                <span className="agent-arrow">→</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
