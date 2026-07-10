import { useState, useMemo } from "react";
import { getMonthYearStr } from '../utils/date/getMonthYearStr';
import { getCurrentMonthYear } from '../utils/date/getCurrentMonthYear';

export default function ProfilePage({ agentName, casperId, rateAmount, submissions = [], onLogout, theme, onThemeToggle }) {
  const currentMonthYear = useMemo(() => getCurrentMonthYear(), []);

  // Determine available months from submissions + current month
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    monthsSet.add(currentMonthYear);
    submissions.forEach(sub => {
      const my = getMonthYearStr(sub.date);
      if (my !== "Unknown") monthsSet.add(my);
    });
    return Array.from(monthsSet);
  }, [submissions, currentMonthYear]);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);

  // Calculate earnings for selected month
  const monthlyStats = useMemo(() => {
    const filtered = submissions.filter(sub => getMonthYearStr(sub.date) === selectedMonth);
    const completed = filtered.reduce((sum, sub) => sum + (Number(sub.completed_count) || 0), 0);
    const total = filtered.reduce((sum, sub) => sum + (Number(sub.total_count) || 0), 0);
    return {
      completed,
      total,
      earnings: completed * rateAmount
    };
  }, [submissions, selectedMonth, rateAmount]);

  // Calculate all-time stats
  const allTimeStats = useMemo(() => {
    const completed = submissions.reduce((sum, sub) => sum + (Number(sub.completed_count) || 0), 0);
    const total = submissions.reduce((sum, sub) => sum + (Number(sub.total_count) || 0), 0);
    return {
      completed,
      total,
      earnings: completed * rateAmount
    };
  }, [submissions, rateAmount]);

  return (
    <div className="profile-view">
      {/* Profile Header Hero */}
      <div className="profile-hero-card">
        <div className="profile-avatar">
          {agentName ? agentName.charAt(0).toUpperCase() : "A"}
        </div>
        <h2 className="profile-name">{agentName}</h2>
        <div className="profile-badge">ID: {casperId}</div>
      </div>

      {/* Stats Quick Info */}
      <div className="profile-meta-grid">
        <div className="profile-meta-item">
          <label>Payout Rate</label>
          <span>₹{rateAmount} <span className="rate-unit">/ task</span></span>
        </div>
        <div className="profile-meta-item">
          <label>All-Time Tasks</label>
          <span>{allTimeStats.completed}</span>
        </div>
      </div>

      {/* Earnings Card */}
      <div className="earnings-dashboard-card">
        <div className="earnings-card-header">
          <div className="earnings-title-group">
            <h3 className="earnings-card-title">Earnings Summary</h3>
            <p className="earnings-card-subtitle">Filter payouts by month</p>
          </div>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-picker-select"
          >
            {availableMonths.map(my => (
              <option key={my} value={my}>{my}</option>
            ))}
          </select>
        </div>

        <div className="earnings-display">
          <div className="earnings-main-value">₹{monthlyStats.earnings.toLocaleString()}</div>
          <div className="earnings-meta-text">
            For {selectedMonth} ({monthlyStats.completed} completed tasks)
          </div>
        </div>

        <div className="earnings-footer-stats">
          <div className="footer-stat-item">
            <label>All-Time Payout</label>
            <span className="success">₹{allTimeStats.earnings.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Theme Switcher Toggle Card */}
      <div className="card theme-toggle-card">
        <div className="theme-toggle-header">
          <div>
            <h3 className="card-title" style={{ fontSize: 'var(--text-base)', margin: 0 }}>Theme Mode</h3>
            <p className="earnings-card-subtitle" style={{ margin: 0 }}>Switch between light and dark themes</p>
          </div>
          <button 
            className="theme-toggle-btn"
            onClick={onThemeToggle}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
                Light Theme
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
                Dark Theme
              </>
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <button className="btn-ghost logout-btn" onClick={onLogout}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Logout Account
      </button>
    </div>
  );
}
