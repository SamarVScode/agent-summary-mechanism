/**
 * ConfirmModal — bottom-sheet modal showing extracted counts before submit.
 */
export default function ConfirmModal({
  visible,
  agentName,
  date,
  totalCount,
  completedCount,
  previewUrl,
  onCancel,
  onConfirm,
  submitting,
}) {
  if (!visible) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && !submitting && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-sheet">
        <div className="modal-handle" />

        <h2 className="modal-title">Review Submission</h2>
        <p className="modal-subtitle">Verify the extracted data from your screenshot</p>

        <div className="modal-body">
          {previewUrl && (
            <div className="modal-thumb-wrap">
              <img
                src={previewUrl}
                alt="Screenshot preview"
                className="modal-thumb"
              />
            </div>
          )}

          <div className="modal-info">
            <div className="profile-item">
              <label>Agent</label>
              <span>{agentName}</span>
            </div>
            <div className="profile-item">
              <label>Date</label>
              <span>{date}</span>
            </div>
            
            <div className="card" style={{ marginTop: '16px', border: '1px solid var(--primary)', background: 'oklch(0.55 0.18 255 / 0.05)' }}>
              <div className="profile-item" style={{ borderBottom: '1px solid oklch(0.55 0.18 255 / 0.1)' }}>
                <label style={{ color: 'var(--primary)' }}>Total Work</label>
                <span style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>{totalCount}</span>
              </div>
              <div className="profile-item" style={{ borderBottom: 'none' }}>
                <label style={{ color: 'var(--success)' }}>Completed</label>
                <span style={{ fontSize: '1.25rem', color: 'var(--success)' }}>{completedCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn-ghost"
            onClick={onCancel}
            disabled={submitting}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            disabled={submitting}
            style={{ flex: 2 }}
          >
            {submitting ? "Saving..." : "Confirm & Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
