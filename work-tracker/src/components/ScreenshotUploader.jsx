import { useRef, useState } from "react";
import { fileToBase64, fileToPreviewUrl } from "../utils/imageUtils";

/**
 * ScreenshotUploader — drag-drop / tap-to-upload zone.
 * Props:
 *   onImageSelected({ file, base64, previewUrl, imageName }) — called after read
 *   disabled — greys out zone during OCR / submission
 */
export default function ScreenshotUploader({ onImageSelected, disabled, currentPreview }) {
  const inputRef   = useRef(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const previewUrl = fileToPreviewUrl(file);
    const base64     = await fileToBase64(file);
    const imageName  = `screenshot-${Date.now()}.${file.name.split(".").pop() || "jpeg"}`;
    onImageSelected({ file, base64, previewUrl, imageName });
  }

  function onInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = "";
  }

  function onDragOver(e) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }
  function onDragLeave() { setDragging(false); }
  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div
      className={`upload-zone ${dragging ? "upload-zone--drag" : ""} ${disabled ? "upload-zone--disabled" : ""}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      aria-label="Upload screenshot"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onInputChange}
        disabled={disabled}
      />

      {currentPreview ? (
        /* Show preview thumbnail with change overlay */
        <div className="upload-preview-wrap">
          <img
            src={currentPreview}
            alt="Uploaded screenshot"
            className="upload-preview-img"
          />
          {!disabled && (
            <div className="upload-preview-overlay">
              <span>📷 Change screenshot</span>
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="upload-empty">
          <div className="upload-icon">📸</div>
          <p className="upload-primary-text">
            {dragging ? "Drop it here!" : "Upload your Summary screenshot"}
          </p>
          <p className="upload-secondary-text">
            Tap to browse or drag &amp; drop
          </p>
        </div>
      )}
    </div>
  );
}
