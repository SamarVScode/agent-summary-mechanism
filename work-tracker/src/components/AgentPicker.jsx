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
          <div className="app-logo">📋</div>
          <h1 className="agent-picker-title">Work Tracker</h1>
          <p className="agent-picker-subtitle">Who are you today?</p>
        </div>

        {/* Search input */}
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
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
              <span>⚠️ Could not load agent list</span>
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
