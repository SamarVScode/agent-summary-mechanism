import { normalizeMonth, MONTHS_3 } from './monthConstants.js';

export const getMonthYearStr = (dateStr) => {
  if (!dateStr) return "Unknown";
  
  // Check for "YYYY-MM-DD"
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateStr.split('-');
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const m = normalizeMonth(monthNum);
    return `${m} ${year}`;
  }
  
  // Check for "DD-MMM-YYYY" (or "DD-Sept-YYYY")
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      const m = normalizeMonth(parts[1]);
      return `${m} ${parts[2]}`;
    }
  }

  // Fallback try Date object
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const m = MONTHS_3[d.getMonth()];
    const y = d.getFullYear();
    return `${m} ${y}`;
  }

  return "Unknown";
};
