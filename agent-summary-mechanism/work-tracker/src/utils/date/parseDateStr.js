export const parseDateStr = (dateStr) => {
  if (!dateStr) return new Date(0);
  // Check for "DD-MMM-YYYY"
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[1].length === 3) {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const day = parseInt(parts[0], 10);
      const monthIdx = months.indexOf(parts[1]);
      const year = parseInt(parts[2], 10);
      if (monthIdx !== -1) {
        return new Date(year, monthIdx, day);
      }
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
};
