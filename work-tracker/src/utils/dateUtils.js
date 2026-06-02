/**
 * formatDate — returns today's date as "02-Jun-2026"
 */
export function formatDate(date = new Date()) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];
  const dd   = String(date.getDate()).padStart(2, "0");
  const mmm  = months[date.getMonth()];
  const yyyy = date.getFullYear();
  return `${dd}-${mmm}-${yyyy}`;
}
