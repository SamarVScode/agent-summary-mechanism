/**
 * SubmissionResult — success or error card shown after submit.
 * Props: result { success, imageUrl, error } | null, onReset, agentName, date, totalCount, completedCount
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
      <div className="result-card result-card--success">
        <div className="result-icon success-checkmark">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h2 className="result-title">Submitted Successfully!</h2>
        <p className="result-meta">
          {date} · {agentName}
        </p>
        <div className="result-counts">
          <div className="result-count-item">
            <span className="result-count-label">Total</span>
            <span className="result-count-value">{totalCount}</span>
          </div>
          <div className="result-count-divider" />
          <div className="result-count-item">
            <span className="result-count-label">Completed</span>
            <span className="result-count-value">{completedCount}</span>
          </div>
        </div>

        <button className="btn-ghost result-reset-btn" onClick={onReset}>
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="result-card result-card--error">
      <div className="result-icon error-cross">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <h2 className="result-title">Submission Failed</h2>
      <p className="result-error-msg">{result.error}</p>
      <button className="btn-primary" onClick={onReset}>
        Try Again
      </button>
    </div>
  );
}
