export const getMonthYearStr = (dateStr) => {
  if (!dateStr) return "Unknown";
  // Check for "YYYY-MM-DD"
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const d = new Date(dateStr);
    const m = d.toLocaleString('default', { month: 'short' });
    const y = d.getFullYear();
    return `${m} ${y}`;
  }
  // Check for "DD-MMM-YYYY"
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      return `${parts[1]} ${parts[2]}`;
    }
  }
  return "Unknown";
};
