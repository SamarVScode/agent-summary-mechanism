/**
 * OcrLoader — full-screen overlay shown while Tesseract.js is processing.
 */
export default function OcrLoader({ visible }) {
  if (!visible) return null;

  return (
    <div className="ocr-overlay" role="status" aria-live="polite">
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', maxWidth: '280px' }}>
        <div className="ocr-spinner" style={{ margin: '0 auto 24px', width: '48px', height: '48px' }} />
        <h2 className="card-title">Analyzing...</h2>
        <p className="card-subtitle">Extracting data from your screenshot</p>
      </div>
    </div>
  );
}
