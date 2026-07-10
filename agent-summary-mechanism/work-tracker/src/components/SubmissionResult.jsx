/**
 * SubmissionResult — success or error card shown after submit.
 */
export default function SubmissionResult({
  result,
  onReset,
  agentName,
  date,
  totalCount,
  completedCount,
}) {
  if (!result) return null;

  if (result.success) {
    return (
      <div className="result-card" style={{ border: '1px solid var(--success)', background: 'var(--success-light)' }}>
        <div className="result-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2 className="result-title" style={{ color: 'var(--success)' }}>Job Well Done!</h2>
        <p className="card-subtitle">
          Logging work for <strong>{agentName}</strong> on <strong>{date}</strong>.
        </p>

        <div className="card" style={{ width: '100%', padding: 'var(--space-md)', background: 'var(--surface)' }}>
          <div className="profile-item" style={{ borderBottom: '1px solid var(--border)' }}>
            <label>Total Work</label>
            <span style={{ fontWeight: '800' }}>{totalCount}</span>
          </div>
          <div className="profile-item" style={{ borderBottom: 'none' }}>
            <label>Completed Tasks</label>
            <span style={{ fontWeight: '800', color: 'var(--success)' }}>{completedCount}</span>
          </div>
        </div>

        <button className="btn-primary" onClick={onReset} style={{ marginTop: '16px' }}>
          Log Another Day
        </button>
      </div>
    );
  }

  return (
    <div className="result-card" style={{ border: '1px solid var(--error)', background: 'var(--error-light)' }}>
      <div className="result-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      </div>
      <h2 className="result-title" style={{ color: 'var(--error)' }}>Submission Failed</h2>
      <p className="card-subtitle" style={{ color: 'var(--error)' }}>{result.error}</p>
      
      <button className="btn-primary" onClick={onReset} style={{ background: 'var(--error)', marginTop: '16px' }}>
        Try Again
      </button>
    </div>
  );
}
