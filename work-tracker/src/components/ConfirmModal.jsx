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
              <span className="modal-info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <span className="modal-info-label">Agent</span>
              <span className="modal-info-value">{agentName}</span>
            </div>
            <div className="modal-info-row">
              <span className="modal-info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              <span className="modal-info-label">Date</span>
              <span className="modal-info-value">{date}</span>
            </div>
            <div className="modal-info-row modal-info-row--highlight">
              <span className="modal-info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
                  <polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"></polygon>
                  <polygon points="12 22.08 12 12 21 6.92 21 17.08 12 22.08"></polygon>
                  <polygon points="12 12 3 6.92 12 1.84 21 6.92 12 12"></polygon>
                </svg>
              </span>
              <span className="modal-info-label">Total (OFD+OFP)</span>
              <span className="modal-info-value modal-info-value--big">
                {totalCount}
              </span>
            </div>
            <div className="modal-info-row modal-info-row--highlight">
              <span className="modal-info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </span>
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
              <>Confirm &amp; Submit</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
