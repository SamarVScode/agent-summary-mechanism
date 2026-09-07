import { normalizeMonth, getMonthIndex, MONTHS_3 } from './monthConstants.js';
import { getCurrentMonthYear } from './getCurrentMonthYear.js';
import { getMonthYearStr } from './getMonthYearStr.js';
import { parseDateStr } from './parseDateStr.js';
import { getDayFromDate, dateMatchesCycle, calculateCycleStats } from './cycleUtils.js';

console.log('--- Running Date & Cycle Verification Tests ---');

// 1. Month Normalization
console.assert(normalizeMonth('Sept') === 'Sep', 'Sept should normalize to Sep');
console.assert(normalizeMonth('sep') === 'Sep', 'sep should normalize to Sep');
console.assert(normalizeMonth('september') === 'Sep', 'september should normalize to Sep');
console.assert(normalizeMonth('September') === 'Sep', 'September should normalize to Sep');
console.assert(normalizeMonth('09') === 'Sep', '09 should normalize to Sep');
console.assert(normalizeMonth(9) === 'Sep', '9 should normalize to Sep');
console.assert(normalizeMonth('01') === 'Jan', '01 should normalize to Jan');
console.assert(normalizeMonth(1) === 'Jan', '1 should normalize to Jan');
console.assert(normalizeMonth('12') === 'Dec', '12 should normalize to Dec');
console.assert(normalizeMonth(12) === 'Dec', '12 should normalize to Dec');
console.log('✓ Month normalization passed');

// 2. getCurrentMonthYear format
const cmy = getCurrentMonthYear();
const parts = cmy.split(' ');
console.assert(parts.length === 2, 'getCurrentMonthYear should be "MMM YYYY"');
console.assert(MONTHS_3.includes(parts[0]), `Month ${parts[0]} should be canonical 3-letter abbreviation`);
console.assert(!isNaN(Number(parts[1])), `Year ${parts[1]} should be numeric`);
console.log('✓ getCurrentMonthYear format passed: ' + cmy);

// 3. getMonthYearStr tolerance
console.assert(getMonthYearStr('07-Sep-2026') === 'Sep 2026', '07-Sep-2026 failed');
console.assert(getMonthYearStr('07-Sept-2026') === 'Sep 2026', '07-Sept-2026 failed');
console.assert(getMonthYearStr('15-Sep-2026') === 'Sep 2026', '15-Sep-2026 failed');
console.assert(getMonthYearStr('2026-09-07') === 'Sep 2026', '2026-09-07 failed');
console.assert(getMonthYearStr('2026-01-15') === 'Jan 2026', '2026-01-15 failed');
console.log('✓ getMonthYearStr tolerance passed');

// 4. parseDateStr tolerance
const d1 = parseDateStr('01-Sep-2026');
console.assert(d1.getDate() === 1 && d1.getMonth() === 8 && d1.getFullYear() === 2026, '01-Sep-2026 parse failed');
const d2 = parseDateStr('15-Sept-2026');
console.assert(d2.getDate() === 15 && d2.getMonth() === 8 && d2.getFullYear() === 2026, '15-Sept-2026 parse failed');
const d3 = parseDateStr('2026-09-16');
console.assert(d3.getDate() === 16 && d3.getMonth() === 8 && d3.getFullYear() === 2026, '2026-09-16 parse failed');
console.log('✓ parseDateStr tolerance passed');

// 5. Cycle Boundaries
console.assert(getDayFromDate('01-Sep-2026') === 1);
console.assert(getDayFromDate('15-Sep-2026') === 15);
console.assert(getDayFromDate('16-Sep-2026') === 16);
console.assert(getDayFromDate('30-Sep-2026') === 30);
console.assert(getDayFromDate('31-Aug-2026') === 31);
console.assert(getDayFromDate('28-Feb-2026') === 28);

console.assert(dateMatchesCycle('01-Sep-2026', 'c1') === true);
console.assert(dateMatchesCycle('15-Sep-2026', 'c1') === true);
console.assert(dateMatchesCycle('16-Sep-2026', 'c1') === false);

console.assert(dateMatchesCycle('01-Sep-2026', 'c2') === false);
console.assert(dateMatchesCycle('15-Sep-2026', 'c2') === false);
console.assert(dateMatchesCycle('16-Sep-2026', 'c2') === true);
console.assert(dateMatchesCycle('30-Sep-2026', 'c2') === true);

console.assert(dateMatchesCycle('10-Sep-2026', 'all') === true);
console.assert(dateMatchesCycle('20-Sep-2026', 'all') === true);
console.log('✓ Cycle boundaries passed');

// 6. calculateCycleStats
const mockSubmissions = [
  { date: '01-Sep-2026', completed_count: 5, total_count: 10 },
  { date: '15-Sept-2026', completed_count: 15, total_count: 20 },
  { date: '16-Sep-2026', completed_count: 8, total_count: 10 },
  { date: '25-Sep-2026', completed_count: 12, total_count: 15 },
  { date: '02-Aug-2026', completed_count: 50, total_count: 60 } // Previous month
];

const stats = calculateCycleStats(mockSubmissions, 'Sep 2026', 13);
// C1: 5 + 15 = 20 tasks * 13 = 260
console.assert(stats.c1.completed === 20, `c1 completed expected 20, got ${stats.c1.completed}`);
console.assert(stats.c1.earnings === 260, `c1 earnings expected 260, got ${stats.c1.earnings}`);
console.assert(stats.c1.count === 2, `c1 count expected 2, got ${stats.c1.count}`);

// C2: 8 + 12 = 20 tasks * 13 = 260
console.assert(stats.c2.completed === 20, `c2 completed expected 20, got ${stats.c2.completed}`);
console.assert(stats.c2.earnings === 260, `c2 earnings expected 260, got ${stats.c2.earnings}`);
console.assert(stats.c2.count === 2, `c2 count expected 2, got ${stats.c2.count}`);

// Total for Sep 2026: 40 tasks * 13 = 520
console.assert(stats.total.completed === 40, `total completed expected 40, got ${stats.total.completed}`);
console.assert(stats.total.earnings === 520, `total earnings expected 520, got ${stats.total.earnings}`);
console.assert(stats.total.count === 4, `total count expected 4, got ${stats.total.count}`);
console.log('✓ calculateCycleStats calculations passed');

console.log('All date & cycle verification tests passed 100%!');
