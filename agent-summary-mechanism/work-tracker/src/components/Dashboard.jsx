import { useState, useMemo } from 'react';
import { getMonthYearStr } from '../utils/date/getMonthYearStr';
import { parseDateStr } from '../utils/date/parseDateStr';
import { getCurrentMonthYear } from '../utils/date/getCurrentMonthYear';

export default function Dashboard({ rateAmount = 13, submissions = [], loading = false, error = null }) {
  const [selectedSub, setSelectedSub] = useState(null);
  
  const currentMonthYear = useMemo(() => getCurrentMonthYear(), []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);

  // Group and sum submissions by date (using array.reduce), sorted descending by calendar date
  const groupedSubmissions = useMemo(() => {
    const grouped = submissions.reduce((acc, sub) => {
      const dateKey = sub.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          ...sub,
          total_count: Number(sub.total_count) || 0,
          completed_count: Number(sub.completed_count) || 0,
          screenshots: sub.image_url ? [{
            url: sub.image_url,
            created_at: sub.created_at,
            total_count: Number(sub.total_count) || 0,
            completed_count: Number(sub.completed_count) || 0
          }] : []
        };
      } else {
        acc[dateKey].total_count += Number(sub.total_count) || 0;
        acc[dateKey].completed_count += Number(sub.completed_count) || 0;
        if (sub.image_url) {
          acc[dateKey].screenshots.push({
            url: sub.image_url,
            created_at: sub.created_at,
            total_count: Number(sub.total_count) || 0,
            completed_count: Number(sub.completed_count) || 0
          });
        }
        // Keep the latest metadata (e.g. image_url, created_at, id)
        const subTime = sub.created_at ? new Date(sub.created_at).getTime() : 0;
        const accTime = acc[dateKey].created_at ? new Date(acc[dateKey].created_at).getTime() : 0;
        if (subTime > accTime) {
          acc[dateKey].id = sub.id;
          acc[dateKey].image_url = sub.image_url;
          acc[dateKey].created_at = sub.created_at;
        }
      }
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => {
      return parseDateStr(b.date).getTime() - parseDateStr(a.date).getTime();
    });
  }, [submissions]);

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

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return groupedSubmissions.filter(sub => getMonthYearStr(sub.date) === selectedMonth);
  }, [groupedSubmissions, selectedMonth]);

  // Find and update the active selected sub object when submissions change
  const activeSelectedSub = useMemo(() => {
    if (!selectedSub) return null;
    return groupedSubmissions.find(sub => sub.date === selectedSub.date) || selectedSub;
  }, [groupedSubmissions, selectedSub]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="ocr-spinner"></div>
        <p>Loading your history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  // Detail View Page
  if (activeSelectedSub) {
    return (
      <div className="detail-view">
        <div className="detail-header">
          <button onClick={() => setSelectedSub(null)} className="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back
          </button>
          <h2 className="detail-title">{activeSelectedSub.date}</h2>
        </div>

        <div className="card detail-summary-card">
          <h3 className="card-title">Daily Summary</h3>
          <p className="card-subtitle">Aggregated totals for this date</p>
          <div className="submission-metrics-row">
            <div className="metric-box">
              <span className="metric-label">Total Tally (OFD+OFP)</span>
              <span className="metric-value">{activeSelectedSub.total_count}</span>
            </div>
            <div className="metric-box success-bg">
              <span className="metric-label success-text">Completed</span>
              <span className="metric-value success-text">{activeSelectedSub.completed_count}</span>
            </div>
          </div>
        </div>

        <div className="screenshots-section">
          <h3 className="card-title" style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>Submitted Screenshots</h3>
          <div className="screenshot-timeline">
            {activeSelectedSub.screenshots.map((shot, idx) => {
              const formattedTime = shot.created_at 
                ? new Date(shot.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "Unknown Time";
              const shotEarnings = shot.completed_count * rateAmount;
              return (
                <div key={idx} className="card screenshot-item-detail">
                  <div className="screenshot-detail-top">
                    <span className="time-badge">{formattedTime}</span>
                    <div className="detail-counts">
                      <span>Total: <strong>{shot.total_count}</strong></span>
                      <span className="success">Completed: <strong>{shot.completed_count}</strong></span>
                    </div>
                  </div>
                  
                  <div className="screenshot-detail-image-wrap">
                    <img src={shot.url} alt={`Screenshot at ${formattedTime}`} className="screenshot-detail-img" />
                    <a href={shot.url} target="_blank" rel="noopener noreferrer" className="screenshot-view-overlay">
                      <span>View Full Image</span>
                    </a>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Estimated earnings for this screenshot</span>
                    <strong style={{ color: 'var(--success)' }}>₹{shotEarnings.toLocaleString()}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-view">
      {/* Month Selector & Page Header */}
      <div className="history-header">
        <div className="history-title-group">
          <h2 className="history-title">Work Logs</h2>
          <p className="history-subtitle">Daily tally and screenshot records</p>
        </div>
        <div className="select-wrapper">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-select"
          >
            {availableMonths.map(my => (
              <option key={my} value={my}>{my}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History timeline list */}
      <div className="history-section">
        {filteredSubmissions.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
              </svg>
            </div>
            <h3>No entries found</h3>
            <p>You haven't submitted any work summaries for {selectedMonth} yet.</p>
          </div>
        ) : (
          <div className="submission-list">
            {filteredSubmissions.map((sub, idx) => {
              const completed = Number(sub.completed_count) || 0;
              const earnings = completed * rateAmount;
              return (
                <div 
                  className="submission-item-card" 
                  key={sub.id || idx}
                  onClick={() => setSelectedSub(sub)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="submission-card-top">
                    <div className="submission-date-badge">{sub.date}</div>
                    <div className="submission-item-earnings">
                      <span className="earnings-tag">Earned</span>
                      <span className="earnings-amount">₹{earnings.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="submission-card-bottom">
                    <div className="submission-metrics-row">
                      <div className="metric-box">
                        <span className="metric-label">Total Tally (OFD+OFP)</span>
                        <span className="metric-value">{sub.total_count}</span>
                      </div>
                      <div className="metric-box success-bg">
                        <span className="metric-label success-text">Completed</span>
                        <span className="metric-value success-text">{completed}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
