import { useState } from "react";

/**
 * Header — shows brand, date, and a hamburger menu for navigation/logout.
 */
export default function Header({ agentName, date, onLogout, currentTab, onTabChange }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleNav = (tab) => {
    onTabChange(tab);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsMenuOpen(false);
  };

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="header-brand">
          <button className="hamburger-btn" onClick={toggleMenu} aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <span className="header-title">Work Tracker</span>
        </div>
        <div className="header-date">{date}</div>
      </div>

      {/* Sidebar / Overlay Menu */}
      {isMenuOpen && (
        <>
          <div className="menu-overlay" onClick={toggleMenu} />
          <div className="side-menu">
            <div className="menu-header">
              <div className="agent-badge">
                <span className="agent-badge-avatar">
                  {agentName.charAt(0).toUpperCase()}
                </span>
                <span className="agent-badge-name">{agentName}</span>
              </div>
              <button className="close-menu-btn" onClick={toggleMenu}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <nav className="menu-nav">
              <button 
                className={`menu-item ${currentTab === "dashboard" ? "active" : ""}`}
                onClick={() => handleNav("dashboard")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px' }}>
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Earning Dashboard
              </button>
              
              <button 
                className={`menu-item ${currentTab === "upload" ? "active" : ""}`}
                onClick={() => handleNav("upload")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Add Screenshot
              </button>

              <div className="menu-divider" />

              <button className="menu-item logout-item" onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px' }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
