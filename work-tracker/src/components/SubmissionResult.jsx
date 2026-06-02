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
        <div className="result-icon">🎉</div>
        <h2 className="result-title">Submitted Successfully!</h2>
        <p className="result-meta">
          {date} · {agentName}
        </p>
        <div className="result-counts">
          <div className="result-count-item">
            <span className="result-count-label">📦 Total</span>
            <span className="result-count-value">{totalCount}</span>
          </div>
          <div className="result-count-divider" />
          <div className="result-count-item">
            <span className="result-count-label">🚚 Completed</span>
            <span className="result-count-value">{completedCount}</span>
          </div>
        </div>

        {result.imageUrl && (
          <a
            href={result.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-drive-link"
          >
            📁 View in Drive
          </a>
        )}

        <button className="btn-ghost result-reset-btn" onClick={onReset}>
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="result-card result-card--error">
      <div className="result-icon">❌</div>
      <h2 className="result-title">Submission Failed</h2>
      <p className="result-error-msg">{result.error}</p>
      <button className="btn-primary" onClick={onReset}>
        Try Again
      </button>
    </div>
  );
}
