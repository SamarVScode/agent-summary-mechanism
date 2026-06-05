import { useState, useCallback } from "react";
import ScreenshotUploader from "./ScreenshotUploader";
import OcrLoader          from "./OcrLoader";
import ConfirmModal       from "./ConfirmModal";
import SubmissionResult   from "./SubmissionResult";
import { useOcrExtract }  from "../hooks/useOcrExtract";
import { useGasSubmit }   from "../hooks/useGasSubmit";
import { formatDate }     from "../utils/dateUtils";
import { calculateFileHash } from "../utils/hashUtils";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

/**
 * TrackerPage — image upload and OCR orchestrator.
 */
export default function TrackerPage({ agentName, casperId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const formattedDate = formatDate(selectedDate);

  // ── image state ───────────────────────────────────────────────────
  const [imageState, setImageState] = useState(null);
  // { file, base64, previewUrl, imageName, fileHash }

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

      setPhase("ocr");
      setToast("");
      resetOcr();

      try {
        // 1. Calculate the file hash
        const fileHash = await calculateFileHash(file);

        setImageState({ file, base64, previewUrl, imageName, fileHash });

        // 2. Check for duplicates in Supabase
        if (SUPABASE_URL && !SUPABASE_URL.includes("PASTE_YOUR")) {
           const checkUrl = `${SUPABASE_URL}/rest/v1/submissions?file_hash=eq.${fileHash}&select=id`;
           const res = await fetch(checkUrl, {
             headers: {
               "apikey": SUPABASE_ANON_KEY,
               "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
             }
           });

           if (res.ok) {
             const data = await res.json();
             if (data && data.length > 0) {
               // Duplicate found!
               setPhase("upload");
               setToast("This screenshot has already been submitted.");
               setTimeout(() => setToast(""), 5000);
               return; // Stop processing
             }
           }
        }

        // 3. Proceed with OCR
        const ocrRes = await extract(file);
        if (ocrRes && ocrRes.success) {
          setPhase("confirm");
        } else {
          setPhase("upload");
          setToast("Could not read screenshot. Please use a clear, well-lit image.");
          setTimeout(() => setToast(""), 5000);
        }
      } catch (err) {
        console.error("Error processing image:", err);
        setPhase("upload");
        setToast("An error occurred while processing the image.");
        setTimeout(() => setToast(""), 5000);
      }
    },
    [imageState, extract, resetOcr]
  );

  const handleConfirm = useCallback(async () => {
    setPhase("submitting");

    const fileExt = imageState?.file?.name?.split(".").pop() || "jpeg";
    const safeAgentName = agentName.trim().replace(/[^a-zA-Z0-9]/g, "_");
    const customImageName = `${safeAgentName}_${formattedDate}_${Date.now()}.${fileExt}`;

    await submit({
      date:           formattedDate,
      agentName,
      casperId,
      totalCount:     ocrResult?.totalCount,
      completedCount: ocrResult?.completedCount,
      imageBase64:    imageState?.base64,
      imageName:      customImageName,
      file:           imageState?.file,
      fileHash:       imageState?.fileHash, // Pass hash to submit
    });
    setPhase("result");
  }, [submit, formattedDate, agentName, ocrResult, imageState]);

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
      <div className="tracker-container">
        <SubmissionResult
          result={submitResult}
          onReset={handleReset}
          agentName={agentName}
          date={formattedDate}
          totalCount={ocrResult?.totalCount}
          completedCount={ocrResult?.completedCount}
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

        <div className="date-selection" style={{ marginBottom: '20px' }}>
          <label htmlFor="upload-date" className="input-label" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>
            Working Date
          </label>
          <input
            id="upload-date"
            type="date"
            className="input-field"
            value={selectedDate.toISOString().split('T')[0]}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            disabled={phase === "ocr" || phase === "submitting"}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '12px', 
              border: '1.5px solid var(--border)', 
              backgroundColor: 'var(--card-bg)', 
              color: 'var(--text)', 
              fontSize: '16px',
              opacity: (phase === "ocr" || phase === "submitting") ? 0.6 : 1
            }}
          />
        </div>

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
