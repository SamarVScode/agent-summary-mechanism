/**
 * Header — shows brand and date.
 */
export default function Header({ date }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-brand">
          <span className="header-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </span>
          <span className="header-title">Work Tracker</span>
        </div>
        <div className="header-date">{date}</div>
      </div>
    </header>
  );
}
