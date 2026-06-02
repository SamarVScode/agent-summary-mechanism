/**
 * Header — shows agent name badge, today's date, and edit button.
 */
export default function Header({ agentName, date, onChangeName }) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-brand">
          <span className="header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </span>
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Change
        </button>
      </div>
    </header>
  );
}
