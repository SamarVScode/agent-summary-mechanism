import { useRef, useEffect, useCallback, useState } from 'react';

export default function LeaveDurationModal({ showDurationModal, setShowDurationModal, selectedDate, startDate, duration, setDuration, reason, setReason, handleDurationSubmit, isChecking }) {
  const options = [1, 2, 3, 4, 5];
  const ITEM_HEIGHT = 40;
  const scrollRef = useRef(null);
  const scrollTimer = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (!showDurationModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [showDurationModal]);

  const scrollToValue = useCallback((val, smooth = true) => {
    if (!scrollRef.current) return;
    const idx = options.indexOf(val);
    if (idx < 0) return;
    scrollRef.current.scrollTo({
      top: idx * ITEM_HEIGHT,
      behavior: smooth ? 'smooth' : 'instant'
    });
  }, [options]);

  useEffect(() => {
    if (showDurationModal) scrollToValue(duration, false);
  }, [showDurationModal, duration, scrollToValue]);

  const updateSelectedDuration = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    const rawIndex = Math.round(scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(options.length - 1, rawIndex));
    setDuration(options[clamped]);
  }, [options, setDuration]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !showDurationModal) return;

    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        updateSelectedDuration();
        setIsScrolling(false);
      }, 150);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer.current);
    };
  }, [showDurationModal, updateSelectedDuration]);

  if (!showDurationModal) return null;

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
      padding: '16px',
      overscrollBehavior: 'contain'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '350px', padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--ink)' }}>Request Leave</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '6px', display: 'block' }}>Start Date</label>
          <div style={{ fontWeight: 600, color: 'var(--ink)', background: 'var(--bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : startDate}
          </div>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '6px', display: 'block' }}>Number of Days</label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              ref={scrollRef}
              style={{
                width: '80px',
                height: '120px',
                overflowY: 'auto',
                scrollSnapType: 'y mandatory',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorY: 'contain',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              className="hide-scrollbar"
            >
              <div style={{ height: '40px', scrollSnapAlign: 'none', flexShrink: 0 }} />
              {options.map((val) => {
                const offset = Math.abs(val - duration);
                const isCenter = offset === 0;
                return (
                  <div
                    key={val}
                    style={{
                      height: '40px',
                      scrollSnapAlign: 'center',
                      scrollSnapStop: 'always',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isCenter ? '28px' : '18px',
                      fontWeight: isCenter ? 800 : 500,
                      color: isCenter ? 'var(--primary)' : 'var(--ink-muted)',
                      opacity: offset === 0 ? 1 : offset === 1 ? 0.5 : 0.25,
                      transform: `scale(${isCenter ? 1 : offset === 1 ? 0.85 : 0.7})`,
                      transformStyle: 'preserve-3d',
                      textShadow: isCenter ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                      transition: isScrolling ? 'none' : 'all 0.15s ease-out',
                      flexShrink: 0
                    }}
                  >
                    {val}
                  </div>
                );
              })}
              <div style={{ height: '40px', scrollSnapAlign: 'none', flexShrink: 0 }} />
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 500 }}>
            {duration === 1 ? '1 day' : `${duration} days`}
          </div>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '6px', display: 'block' }}>Reason (Optional)</label>
          <textarea 
            value={reason} 
            onChange={e => setReason(e.target.value)}
            rows="3"
            className="search-input"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', resize: 'vertical' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            onClick={() => setShowDurationModal(false)}
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
            onClick={handleDurationSubmit}
            disabled={isChecking}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '14px', opacity: isChecking ? 0.7 : 1 }}
          >
            {isChecking ? 'Checking...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
