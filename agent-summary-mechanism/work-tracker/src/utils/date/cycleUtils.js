import { getMonthYearStr } from './getMonthYearStr.js';

/**
 * Extracts numeric calendar day (1–31) from date string.
 * Supports "DD-MMM-YYYY", "DD-Sept-YYYY", "YYYY-MM-DD".
 *
 * @param {string} dateStr
 * @returns {number|null} day integer or null
 */
export function getDayFromDate(dateStr) {
  if (!dateStr) return null;

  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    // YYYY-MM-DD
    if (parts.length === 3 && parts[0].length === 4) {
      const d = parseInt(parts[2], 10);
      return isNaN(d) ? null : d;
    }
    // DD-MMM-YYYY
    if (parts.length === 3 && parts[2].length === 4) {
      const d = parseInt(parts[0], 10);
      return isNaN(d) ? null : d;
    }
  }

  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.getDate();
  }

  return null;
}

/**
 * Checks if date falls within the requested payout cycle:
 * 'c1' -> 1st to 15th
 * 'c2' -> 16th to end of month
 * 'all' -> entire month
 *
 * @param {string} dateStr
 * @param {string} cycle - 'all' | 'c1' | 'c2'
 * @returns {boolean}
 */
export function dateMatchesCycle(dateStr, cycle = 'all') {
  if (!cycle || cycle === 'all') return true;

  const day = getDayFromDate(dateStr);
  if (day === null) return true;

  if (cycle === 'c1') return day <= 15;
  if (cycle === 'c2') return day >= 16;

  return true;
}

/**
 * Human-readable label for payout cycle.
 */
export function getCycleLabel(cycle) {
  if (cycle === 'c1') return 'Cycle 1 (1st – 15th)';
  if (cycle === 'c2') return 'Cycle 2 (16th – End)';
  return 'Entire Month (Full)';
}

/**
 * Calculates earnings, tasks, and count broken down by Cycle 1, Cycle 2, and Full Month.
 *
 * @param {Array} submissions - List of submission objects
 * @param {string} selectedMonth - e.g. "Sep 2026"
 * @param {number} rateAmount - Payout per completed task
 * @returns {{ c1: Object, c2: Object, total: Object }}
 */
export function calculateCycleStats(submissions = [], selectedMonth = '', rateAmount = 13) {
  const stats = {
    c1: { completed: 0, total: 0, earnings: 0, count: 0 },
    c2: { completed: 0, total: 0, earnings: 0, count: 0 },
    total: { completed: 0, total: 0, earnings: 0, count: 0 }
  };

  submissions.forEach(sub => {
    // Only consider submissions for selectedMonth if provided
    if (selectedMonth && getMonthYearStr(sub.date) !== selectedMonth) {
      return;
    }

    const completed = Number(sub.completed_count) || 0;
    const totalCount = Number(sub.total_count) || 0;
    const earnings = completed * rateAmount;
    const day = getDayFromDate(sub.date);

    stats.total.completed += completed;
    stats.total.total += totalCount;
    stats.total.earnings += earnings;
    stats.total.count += 1;

    if (day !== null && day <= 15) {
      stats.c1.completed += completed;
      stats.c1.total += totalCount;
      stats.c1.earnings += earnings;
      stats.c1.count += 1;
    } else if (day !== null && day >= 16) {
      stats.c2.completed += completed;
      stats.c2.total += totalCount;
      stats.c2.earnings += earnings;
      stats.c2.count += 1;
    }
  });

  return stats;
}
