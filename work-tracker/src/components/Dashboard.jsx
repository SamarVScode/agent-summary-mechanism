import { useSubmissions } from "../hooks/useSubmissions";

export default function Dashboard({ agentName, rateAmount = 13 }) {
  const { submissions, loading, error } = useSubmissions(agentName);

  if (loading) {
    return (
      <div className="card">
        <div className="empty-state">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="empty-state" style={{ color: "var(--error)" }}>
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
    <div>
      <div className="dashboard-stat-card">
        <div className="dashboard-stat-label">Total Earnings</div>
        <div className="dashboard-stat-value">₹{totalEarnings.toLocaleString()}</div>
      </div>

      <div className="card">
        <h2 className="card-title">Recent Submissions</h2>
        <p className="card-subtitle">Your daily completed tasks and earnings</p>

        {submissions.length === 0 ? (
          <div className="empty-state">No submissions yet. Start uploading your daily summaries!</div>
        ) : (
          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Completed</th>
                  <th>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, idx) => {
                  const completed = Number(sub.completed_count) || 0;
                  const earnings = completed * rateAmount;
                  return (
                    <tr key={sub.id || idx}>
                      <td>{sub.date}</td>
                      <td>{sub.total_count}</td>
                      <td>{completed}</td>
                      <td className="earnings-cell">₹{earnings.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
