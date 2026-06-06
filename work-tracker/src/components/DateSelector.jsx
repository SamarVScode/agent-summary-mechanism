/**
 * DateSelector — simple styled date input for selecting the working date.
 */
export default function DateSelector({ selectedDate, onChange, disabled }) {
  return (
    <div className="date-selection" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="upload-date"
        className="input-label"
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "14px",
          fontWeight: "600",
          color: "var(--text-muted)",
        }}
      >
        Working Date
      </label>
      <input
        id="upload-date"
        type="date"
        className="input-field"
        value={selectedDate.toISOString().split("T")[0]}
        max={new Date().toISOString().split("T")[0]}
        onChange={(e) => onChange(new Date(e.target.value))}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: "1.5px solid var(--border)",
          backgroundColor: "var(--card-bg)",
          color: "var(--text)",
          fontSize: "16px",
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  );
}
