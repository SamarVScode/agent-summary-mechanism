/**
 * Standard 3-letter month abbreviations used consistently across the database and UI.
 */
export const MONTHS_3 = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_ALIAS_MAP = {
  "sept": "Sep",
  "september": "Sep",
  "sep": "Sep",
  "january": "Jan",
  "february": "Feb",
  "march": "Mar",
  "april": "Apr",
  "june": "Jun",
  "july": "Jul",
  "august": "Aug",
  "october": "Oct",
  "november": "Nov",
  "december": "Dec"
};

/**
 * Normalizes any month string or number to the canonical 3-letter abbreviation.
 * e.g. "Sept" -> "Sep", "September" -> "Sep", "09" -> "Sep", 8 -> "Sep"
 *
 * @param {string|number} monthInput
 * @returns {string} 3-letter month name (e.g. "Sep") or fallback if unknown.
 */
export function normalizeMonth(monthInput) {
  if (monthInput === null || monthInput === undefined) return "Unknown";

  if (typeof monthInput === "number") {
    // 1-indexed calendar month (1 - 12)
    if (monthInput >= 1 && monthInput <= 12) {
      return MONTHS_3[monthInput - 1];
    }
    // 0-indexed JS month (0 - 11)
    if (monthInput === 0) {
      return MONTHS_3[0];
    }
  }

  const str = String(monthInput).trim().toLowerCase();
  
  // Direct alias map
  if (MONTH_ALIAS_MAP[str]) {
    return MONTH_ALIAS_MAP[str];
  }

  // Numeric string check (e.g. "09" or "9")
  const num = parseInt(str, 10);
  if (!isNaN(num) && String(num) === str.replace(/^0+/, '')) {
    if (num >= 1 && num <= 12) {
      return MONTHS_3[num - 1];
    }
  }

  // First 3 letters match against MONTHS_3
  const sub3 = str.slice(0, 3);
  const foundIdx = MONTHS_3.findIndex(m => m.toLowerCase() === sub3);
  if (foundIdx !== -1) {
    return MONTHS_3[foundIdx];
  }

  return monthInput;
}

/**
 * Returns 0-based month index (0 for Jan, 8 for Sep, etc.), or -1 if invalid.
 */
export function getMonthIndex(monthInput) {
  const norm = normalizeMonth(monthInput);
  return MONTHS_3.indexOf(norm);
}
