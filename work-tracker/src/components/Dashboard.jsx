export default function Dashboard({ rateAmount = 13, submissions = [], loading = false, error = null }) {

  if (loading) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="ocr-spinner" style={{ margin: '0 auto 16px' }}></div>
          Loading your history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="empty-state error">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  const totalCompleted = submissions.reduce((sum, sub) => {
    return sum + (Number(sub.completed_count) || 0);
  }, 0);

  const totalEarnings = totalCompleted * rateAmount;

  return (
    <div className="dashboard-view">
      <div className="dashboard-stat-card">
        <div className="dashboard-stat-label">Total Earnings</div>
        <div className="dashboard-stat-value">₹{totalEarnings.toLocaleString()}</div>
        <div className="dashboard-stat-meta">{totalCompleted} tasks completed</div>
      </div>

      <div className="history-section">
        <h2 className="section-title" style={{ margin: '24px 0 16px' }}>Recent Work</h2>
        
        {submissions.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              No submissions yet. Start uploading your daily summaries!
            </div>
          </div>
        ) : (
          <div className="submission-list">
            {submissions.map((sub, idx) => {
              const completed = Number(sub.completed_count) || 0;
              const earnings = completed * rateAmount;
              return (
                <div className="card submission-item" key={sub.id || idx}>
                  <div className="submission-main">
                    <div className="submission-date">{sub.date}</div>
                    <div className="submission-stats">
                      <span className="stat-pill">
                        Total OFD+OFP <strong>{sub.total_count}</strong>
                      </span>
                      <span className="stat-pill success">
                        DEL+PICKED <strong>{completed}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="submission-earnings">
                    <div className="earnings-label">Earned</div>
                    <div className="earnings-value">₹{earnings.toLocaleString()}</div>
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
