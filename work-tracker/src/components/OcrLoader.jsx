/**
 * OcrLoader — full-screen overlay shown while Tesseract.js is processing.
 */
export default function OcrLoader({ visible }) {
  if (!visible) return null;

  return (
    <div className="ocr-overlay" role="status" aria-live="polite">
      <div className="ocr-loader-card">
        <div className="ocr-spinner" />
        <p className="ocr-text">Reading screenshot…</p>
        <p className="ocr-subtext">Extracting your work counts</p>
      </div>
    </div>
  );
}
