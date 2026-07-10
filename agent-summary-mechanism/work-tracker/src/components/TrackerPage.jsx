import { useState, useCallback } from "react";
import ScreenshotUploader from "./ScreenshotUploader";
import OcrLoader          from "./OcrLoader";
import ConfirmModal       from "./ConfirmModal";
import SubmissionResult   from "./SubmissionResult";
import DateSelector       from "./DateSelector";
import { useOcrExtract }  from "../hooks/useOcrExtract";
import { useGasSubmit }   from "../hooks/useGasSubmit";
import { useImageUpload } from "../hooks/useImageUpload";
import { formatDate } from "../utils/dateUtils";

/**
 * TrackerPage — image upload and OCR orchestrator.
 */
export default function TrackerPage({ agentName, casperId, onSubmissionSuccess }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const formattedDate = formatDate(selectedDate);

  const [finalCounts, setFinalCounts] = useState(null);

  // ── hooks ─────────────────────────────────────────────────────────
  const { extract, result: ocrResult, reset: resetOcr } = useOcrExtract();
  const { submit, submitting, result: submitResult, resetResult } = useGasSubmit();

  const {
    imageState,
    setImageState,
    phase,
    setPhase,
    toast,
    setToast,
    handleImageSelected
  } = useImageUpload(extract, resetOcr);

  // ── handlers ─────────────────────────────────────────────────────


  const handleConfirm = useCallback(async (finalTotal, finalCompleted) => {
    setPhase("submitting");
    setFinalCounts({ totalCount: finalTotal, completedCount: finalCompleted });

    const fileExt = imageState?.file?.name?.split(".").pop() || "jpeg";
    const safeAgentName = agentName.trim().replace(/[^a-zA-Z0-9]/g, "_");
    const customImageName = `${safeAgentName}_${formattedDate}_${Date.now()}.${fileExt}`;

    const response = await submit({
      date:           formattedDate,
      agentName,
      casperId,
      totalCount:     finalTotal,
      completedCount: finalCompleted,
      imageBase64:    imageState?.base64,
      imageName:      customImageName,
      file:           imageState?.file,
      fileHash:       imageState?.fileHash, // Pass hash to submit
    });

    if (response && response.success && onSubmissionSuccess) {
      onSubmissionSuccess();
    }
    setPhase("result");
  }, [submit, formattedDate, agentName, imageState, casperId, onSubmissionSuccess]);

  const handleCancel = useCallback(() => {
    setPhase("confirm"); // just close modal, keep data
  }, []);

  const handleReset = useCallback(() => {
    if (imageState?.previewUrl) URL.revokeObjectURL(imageState.previewUrl);
    setImageState(null);
    setFinalCounts(null);
    resetOcr();
    resetResult();
    setPhase("upload");
    setToast("");
  }, [imageState, resetOcr, resetResult]);

  // ── render ────────────────────────────────────────────────────────

  // After result is shown, show the result screen instead of the form
  if (phase === "result" && submitResult) {
    return (
      <div className="tracker-container">
        <SubmissionResult
          result={submitResult}
          onReset={handleReset}
          agentName={agentName}
          date={formattedDate}
          totalCount={finalCounts?.totalCount ?? ocrResult?.totalCount}
          completedCount={finalCounts?.completedCount ?? ocrResult?.completedCount}
        />
      </div>
    );
  }

  return (
    <div className="tracker-container">
      {/* Toast */}
      {toast && <div className="toast toast--error">{toast}</div>}

      {/* Upload card */}
      <div className="card upload-card">
        <h2 className="card-title">Work Summary</h2>
        <p className="card-subtitle">
          Select date and upload your end-of-day Summary screenshot
        </p>

        <DateSelector
          selectedDate={selectedDate}
          onChange={setSelectedDate}
          disabled={phase === "ocr" || phase === "submitting"}
        />

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
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

      {/* OCR overlay */}
      <OcrLoader visible={phase === "ocr"} />

      {/* Confirm modal */}
      <ConfirmModal
        visible={phase === "confirm" || phase === "submitting"}
        agentName={agentName}
        date={formattedDate}
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
