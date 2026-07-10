import { useState, useEffect } from "react";

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
  const [editedTotal, setEditedTotal] = useState("");
  const [editedCompleted, setEditedCompleted] = useState("");

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditedTotal(totalCount === "—" ? "" : totalCount);
      setEditedCompleted(completedCount === "—" ? "" : completedCount);
    }
  }, [visible, totalCount, completedCount]);
  if (!visible) return null;

  const handleConfirmClick = () => {
    onConfirm(Number(editedTotal) || 0, Number(editedCompleted) || 0);
  };

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
            
            <div className="card" style={{ marginTop: '16px', border: '1px solid var(--primary)', background: 'var(--primary-light)' }}>
              <div className="profile-item" style={{ borderBottom: '1px solid var(--border)' }}>
                <label style={{ color: 'var(--primary)' }}>Total Work</label>
                <input 
                  type="number"
                  value={editedTotal}
                  onChange={(e) => setEditedTotal(e.target.value)}
                  style={{ 
                    fontSize: '1.25rem', 
                    color: 'var(--primary)', 
                    background: 'transparent', 
                    border: '1px solid var(--primary)', 
                    borderRadius: '4px',
                    width: '80px',
                    textAlign: 'right',
                    padding: '2px 8px',
                    outline: 'none'
                  }} 
                />
              </div>
              <div className="profile-item" style={{ borderBottom: 'none' }}>
                <label style={{ color: 'var(--success)' }}>Completed</label>
                <input 
                  type="number"
                  value={editedCompleted}
                  onChange={(e) => setEditedCompleted(e.target.value)}
                  style={{ 
                    fontSize: '1.25rem', 
                    color: 'var(--success)', 
                    background: 'transparent', 
                    border: '1px solid var(--success)', 
                    borderRadius: '4px',
                    width: '80px',
                    textAlign: 'right',
                    padding: '2px 8px',
                    outline: 'none'
                  }} 
                />
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
            onClick={handleConfirmClick}
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
