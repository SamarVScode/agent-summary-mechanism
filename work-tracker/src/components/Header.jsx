/**
 * Header — shows agent name badge, today's date, and edit button.
 */
export default function Header({ agentName, date, onChangeName }) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-brand">
          <span className="header-icon">📋</span>
          <span className="header-title">Work Tracker</span>
        </div>
        <div className="header-date">{date}</div>
      </div>

      <div className="header-agent-row">
        <div className="agent-badge">
          <span className="agent-badge-avatar">
            {agentName.charAt(0).toUpperCase()}
          </span>
          <span className="agent-badge-name">{agentName}</span>
        </div>
        <button
          className="btn-change-name"
          onClick={onChangeName}
          title="Change name"
          aria-label="Change agent name"
        >
          ✏️ Change
        </button>
      </div>
    </header>
  );
}
