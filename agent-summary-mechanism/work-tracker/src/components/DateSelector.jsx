/**
 * DateSelector — simple styled date input for selecting the working date.
 */
export default function DateSelector({ selectedDate, onChange, disabled }) {
  const getLocalDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [year, month, day] = val.split("-").map(Number);
    onChange(new Date(year, month - 1, day));
  };

  return (
    <div className="date-selection" style={{ marginBottom: "20px" }}>
      <label
        htmlFor="upload-date"
        className="section-title"
        style={{ display: "block", marginBottom: "8px" }}
      >
        Working Date
      </label>
      <div className="search-wrap">
        <span className="search-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </span>
        <input
          id="upload-date"
          type="date"
          className="search-input"
          value={getLocalDateString(selectedDate)}
          max={getLocalDateString(new Date())}
          onChange={handleDateChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
