import { useState, useCallback } from "react";
import Header            from "./Header";
import ScreenshotUploader from "./ScreenshotUploader";
import OcrLoader          from "./OcrLoader";
import ConfirmModal       from "./ConfirmModal";
import SubmissionResult   from "./SubmissionResult";
import { useOcrExtract }  from "../hooks/useOcrExtract";
import { useGasSubmit }   from "../hooks/useGasSubmit";
import { formatDate }     from "../utils/dateUtils";

/**
 * TrackerPage — main page orchestrator.
 *
 * State machine:
 *   "upload" → image selected → "ocr" → OCR done →
 *     success: "confirm" (modal shown)
 *     error:   back to "upload" with toast
 *   "confirm" → confirmed → "submitting" → "result"
 *   "result"  → reset → "upload"
 */
export default function TrackerPage({ agentName, onChangeName }) {
  const today = formatDate();

  // ── image state ───────────────────────────────────────────────────
  const [imageState, setImageState] = useState(null);
  // { file, base64, previewUrl, imageName }

  // ── page phase ────────────────────────────────────────────────────
  const [phase, setPhase] = useState("upload");
  // "upload" | "ocr" | "confirm" | "submitting" | "result"

  // ── toast for OCR error ───────────────────────────────────────────
  const [toast, setToast] = useState("");

  // ── hooks ─────────────────────────────────────────────────────────
  const { extract, result: ocrResult, reset: resetOcr } = useOcrExtract();
  const { submit, submitting, result: submitResult, resetResult } = useGasSubmit();

  // ── handlers ─────────────────────────────────────────────────────

  const handleImageSelected = useCallback(
    async ({ file, base64, previewUrl, imageName }) => {
      // Revoke previous object URL to free memory
      if (imageState?.previewUrl) URL.revokeObjectURL(imageState.previewUrl);

      setImageState({ file, base64, previewUrl, imageName });
      setPhase("ocr");
      setToast("");
      resetOcr();

      const ocrRes = await extract(file);
      if (ocrRes && ocrRes.success) {
        setPhase("confirm");
      } else {
        setPhase("upload");
        setToast(
          "Could not read screenshot. Please use a clear, well-lit image."
        );
        setTimeout(() => setToast(""), 5000);
      }
    },
    [imageState, extract, resetOcr]
  );

  const handleConfirm = useCallback(async () => {
    setPhase("submitting");

    const fileExt = imageState?.file?.name?.split(".").pop() || "jpeg";
    const safeAgentName = agentName.trim().replace(/[^a-zA-Z0-9]/g, "_");
    const customImageName = `${safeAgentName}_${today}_${Date.now()}.${fileExt}`;

    await submit({
      date:           today,
      agentName,
      totalCount:     ocrResult?.totalCount,
      completedCount: ocrResult?.completedCount,
      imageBase64:    imageState?.base64,
      imageName:      customImageName,
      file:           imageState?.file,
    });
    setPhase("result");
  }, [submit, today, agentName, ocrResult, imageState]);

  const handleCancel = useCallback(() => {
    setPhase("confirm"); // just close modal, keep data
  }, []);

  const handleReset = useCallback(() => {
    if (imageState?.previewUrl) URL.revokeObjectURL(imageState.previewUrl);
    setImageState(null);
    resetOcr();
    resetResult();
    setPhase("upload");
    setToast("");
  }, [imageState, resetOcr, resetResult]);

  // ── render ────────────────────────────────────────────────────────

  // After result is shown, show the result screen instead of the form
  if (phase === "result" && submitResult) {
    return (
      <div className="page">
        <Header agentName={agentName} date={today} onChangeName={onChangeName} />
        <main className="page-main">
          <SubmissionResult
            result={submitResult}
            onReset={handleReset}
            agentName={agentName}
            date={today}
            totalCount={ocrResult?.totalCount}
            completedCount={ocrResult?.completedCount}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Header agentName={agentName} date={today} onChangeName={onChangeName} />

      <main className="page-main">
        {/* Toast */}
        {toast && <div className="toast toast--error">{toast}</div>}

        {/* Upload card */}
        <div className="card upload-card">
          <h2 className="card-title">Today&apos;s Summary</h2>
          <p className="card-subtitle">
            Upload your end-of-day Summary screenshot
          </p>
          <ScreenshotUploader
            onImageSelected={handleImageSelected}
            disabled={phase === "ocr" || phase === "submitting"}
            currentPreview={imageState?.previewUrl}
          />
        </div>

        {/* OCR hint */}
        {phase === "upload" && !imageState && (
          <div className="hint-card">
            <span className="hint-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A7.5 7.5 0 0 0 3 8c0 1.3.5 2.6 1.5 3.5.7.8 1.3 1.5 1.5 2.5"></path>
                <line x1="9" y1="18" x2="15" y2="18"></line>
                <line x1="10" y1="22" x2="14" y2="22"></line>
              </svg>
            </span>
            <span>
              The app will automatically read the <strong>Total</strong> and{" "}
              <strong>Completed</strong> counts from your screenshot.
            </span>
          </div>
        )}
      </main>

      {/* OCR overlay */}
      <OcrLoader visible={phase === "ocr"} />

      {/* Confirm modal */}
      <ConfirmModal
        visible={phase === "confirm" || phase === "submitting"}
        agentName={agentName}
        date={today}
        totalCount={ocrResult?.totalCount ?? "—"}
        completedCount={ocrResult?.completedCount ?? "—"}
        previewUrl={imageState?.previewUrl}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        submitting={submitting}
      />
    </div>
  );
}


