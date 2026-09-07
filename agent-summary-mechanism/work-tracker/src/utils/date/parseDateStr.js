import { getMonthIndex } from './monthConstants.js';

export const parseDateStr = (dateStr) => {
  if (!dateStr) return new Date(0);
  
  // Check for "DD-MMM-YYYY" or "DD-Sept-YYYY" or "YYYY-MM-DD"
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // If YYYY-MM-DD
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day);
        }
      }
      
      // If DD-MMM-YYYY or DD-Sept-YYYY
      if (parts[2].length === 4) {
        const day = parseInt(parts[0], 10);
        const monthIdx = getMonthIndex(parts[1]);
        const year = parseInt(parts[2], 10);
        if (monthIdx !== -1 && !isNaN(day) && !isNaN(year)) {
          return new Date(year, monthIdx, day);
        }
      }
    }
  }
  
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};
