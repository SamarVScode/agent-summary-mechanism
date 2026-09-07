import { useState, useMemo } from "react";
import { getMonthYearStr } from '../utils/date/getMonthYearStr.js';
import { getCurrentMonthYear } from '../utils/date/getCurrentMonthYear.js';
import { calculateCycleStats, getCurrentCycle } from '../utils/date/cycleUtils.js';

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
  // Default to the current active cycle (c1 if today <= 15, else c2)
  const [selectedCycle, setSelectedCycle] = useState(getCurrentCycle());

  // Calculate bi-monthly cycle earnings for selected month
  const cycleStats = useMemo(() => {
    return calculateCycleStats(submissions, selectedMonth, rateAmount);
  }, [submissions, selectedMonth, rateAmount]);

  // Determine the amount and task count to show based on selectedCycle
  const displayedStats = useMemo(() => {
    if (selectedCycle === 'c1') {
      return {
        earnings: cycleStats.c1.earnings,
        completed: cycleStats.c1.completed
      };
    }
    if (selectedCycle === 'c2') {
      return {
        earnings: cycleStats.c2.earnings,
        completed: cycleStats.c2.completed
      };
    }
    return {
      earnings: cycleStats.total.earnings,
      completed: cycleStats.total.completed
    };
  }, [cycleStats, selectedCycle]);

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
        {/* Month & Cycle Dropdowns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginBottom: '16px'
        }}>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-picker-select"
            aria-label="Select Month"
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              fontSize: 'var(--text-xs)', 
              fontWeight: 600, 
              borderRadius: 'var(--radius-sm)' 
            }}
          >
            {availableMonths.map(my => (
              <option key={my} value={my}>{my}</option>
            ))}
          </select>

          <select 
            value={selectedCycle} 
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="month-picker-select"
            aria-label="Select Payout Cycle"
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              fontSize: 'var(--text-xs)', 
              fontWeight: 600, 
              borderRadius: 'var(--radius-sm)' 
            }}
          >
            <option value="c1">Cycle 1 (1st – 15th)</option>
            <option value="c2">Cycle 2 (16th – End)</option>
            <option value="all">Complete Month</option>
          </select>
        </div>

        {/* Single Earning + Task Completed Count */}
        <div className="earnings-display" style={{ margin: 0, padding: '12px 0 4px 0' }}>
          <div className="earnings-main-value">₹{displayedStats.earnings.toLocaleString()}</div>
          <div className="earnings-meta-text">
            {displayedStats.completed} tasks completed
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
