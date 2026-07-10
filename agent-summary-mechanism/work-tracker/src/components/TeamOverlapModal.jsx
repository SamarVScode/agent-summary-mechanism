import { useEffect } from 'react';

export default function TeamOverlapModal({ overlapModalData, setOverlapModalData, submitLeaveRequest, submitting }) {
  useEffect(() => {
    if (!overlapModalData) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [overlapModalData]);

  if (!overlapModalData) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(4px)',
      padding: '16px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '350px', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--ink)' }}>Team Overlap Detected</h3>
        <p style={{ fontSize: '14px', color: 'var(--ink-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--ink)' }}>{overlapModalData.join(" and ")}</strong> {overlapModalData.length > 1 ? 'are' : 'is'} already approved for leave during these dates.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '24px' }}>
          We recommend taking leave on another date, but you can proceed if necessary.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setOverlapModalData(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-muted)',
              fontWeight: 600,
              fontSize: '14px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={() => submitLeaveRequest()}
            disabled={submitting}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '14px', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Submitting...' : 'Proceed Anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
