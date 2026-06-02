/**
 * ConfirmModal — bottom-sheet modal showing extracted counts before submit.
 * Props:
 *   visible, agentName, date, totalCount, completedCount,
 *   previewUrl, onCancel, onConfirm, submitting
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
      aria-label="Confirm submission"
    >
      <div className="modal-sheet">
        {/* Drag handle (visual only) */}
        <div className="modal-handle" />

        <h2 className="modal-title">Confirm Submission</h2>
        <p className="modal-subtitle">Review before saving</p>

        <div className="modal-body">
          {/* Screenshot thumbnail */}
          {previewUrl && (
            <div className="modal-thumb-wrap">
              <img
                src={previewUrl}
                alt="Screenshot preview"
                className="modal-thumb"
              />
            </div>
          )}

          {/* Summary rows */}
          <div className="modal-info">
            <div className="modal-info-row">
              <span className="modal-info-icon">👤</span>
              <span className="modal-info-label">Agent</span>
              <span className="modal-info-value">{agentName}</span>
            </div>
            <div className="modal-info-row">
              <span className="modal-info-icon">📅</span>
              <span className="modal-info-label">Date</span>
              <span className="modal-info-value">{date}</span>
            </div>
            <div className="modal-info-row modal-info-row--highlight">
              <span className="modal-info-icon">📦</span>
              <span className="modal-info-label">Total (OFD+OFP)</span>
              <span className="modal-info-value modal-info-value--big">
                {totalCount}
              </span>
            </div>
            <div className="modal-info-row modal-info-row--highlight">
              <span className="modal-info-icon">🚚</span>
              <span className="modal-info-label">Completed (Del+PU)</span>
              <span className="modal-info-value modal-info-value--big">
                {completedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button
            className="btn-ghost"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="btn-spinner" />
                Saving…
              </>
            ) : (
              <>✓ Confirm &amp; Submit</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
