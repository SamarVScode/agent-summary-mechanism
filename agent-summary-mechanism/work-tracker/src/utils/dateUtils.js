import { MONTHS_3 } from "./date/monthConstants";

/**
 * formatDate — returns date formatted as "02-Jun-2026"
 */
export function formatDate(date = new Date()) {
  const dd   = String(date.getDate()).padStart(2, "0");
  const mmm  = MONTHS_3[date.getMonth()];
  const yyyy = date.getFullYear();
  return `${dd}-${mmm}-${yyyy}`;
}
