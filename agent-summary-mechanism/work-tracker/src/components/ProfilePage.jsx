import { useState, useMemo } from "react";
import { getMonthYearStr } from '../utils/date/getMonthYearStr.js';
import { getCurrentMonthYear } from '../utils/date/getCurrentMonthYear.js';
import { calculateCycleStats } from '../utils/date/cycleUtils.js';

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

  // Calculate bi-monthly cycle earnings for selected month
  const cycleStats = useMemo(() => {
    return calculateCycleStats(submissions, selectedMonth, rateAmount);
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
            <p className="earnings-card-subtitle">Filter payouts by month & cycle</p>
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
          <div className="earnings-main-value">₹{cycleStats.total.earnings.toLocaleString()}</div>
          <div className="earnings-meta-text">
            Total for {selectedMonth} ({cycleStats.total.completed} completed tasks)
          </div>
        </div>

        {/* Bi-Monthly Cycles Breakdown Cards (Cycle 1 vs Cycle 2) */}
        <div className="cycle-breakdown-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginTop: '16px',
          marginBottom: '16px'
        }}>
          {/* Cycle 1 Card (1st - 15th) */}
          <div className="cycle-card cycle-1-card" style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cycle 1
              </span>
              <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>1st – 15th</span>
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--ink)' }}>
              ₹{cycleStats.c1.earnings.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', marginTop: '4px' }}>
              {cycleStats.c1.completed} tasks ({cycleStats.c1.count} logs)
            </div>
          </div>

          {/* Cycle 2 Card (16th - End) */}
          <div className="cycle-card cycle-2-card" style={{
            background: 'var(--surface-hover)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cycle 2
              </span>
              <span style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>16th – End</span>
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--ink)' }}>
              ₹{cycleStats.c2.earnings.toLocaleString()}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-secondary)', marginTop: '4px' }}>
              {cycleStats.c2.completed} tasks ({cycleStats.c2.count} logs)
            </div>
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
