import { describe, it, expect } from 'vitest';
import { formatDateRange } from './formatDateRange';
import { formatDate } from './formatDate';

describe('Date Utilities (Agent App)', () => {
  describe('formatDate', () => {
    it('should return an empty string if dateStr is missing', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(null)).toBe('');
    });

    it('should format a date string correctly', () => {
      // '2023-10-15' -> 'Oct 15, 2023'
      const formatted = formatDate('2023-10-15');
      // toLocaleDateString might format it slightly differently depending on locale (e.g. Oct 15, 2023 vs 10/15/2023)
      // Since en-US is specified with { month: 'short', day: 'numeric', year: 'numeric' }, it returns 'Oct 15, 2023'
      expect(formatted).toBe('Oct 15, 2023');
    });
  });

  describe('formatDateRange', () => {
    it('should return an empty string if start or end date is missing', () => {
      expect(formatDateRange(null, '2023-10-15')).toBe('');
      expect(formatDateRange('2023-10-12', null)).toBe('');
    });

    it('should return a single formatted date if start and end dates are the same', () => {
      expect(formatDateRange('2023-10-15', '2023-10-15')).toBe('Oct 15, 2023');
    });

    it('should return a range string if start and end dates are different', () => {
      expect(formatDateRange('2023-10-12', '2023-10-15')).toBe('Oct 12, 2023 - Oct 15, 2023');
    });
  });
});
