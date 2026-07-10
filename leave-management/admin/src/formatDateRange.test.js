import { describe, it, expect } from 'vitest';
import { formatDateRange } from './formatDateRange';

describe('formatDateRange (Admin)', () => {
  it('should return empty string if start or end date is missing', () => {
    expect(formatDateRange(null, '2023-10-15')).toBe('');
    expect(formatDateRange('2023-10-12', null)).toBe('');
    expect(formatDateRange(null, null)).toBe('');
  });

  it('should return a single formatted date if start and end dates are the same', () => {
    // 2023-10-15 is parsed as local time by parseISO if there's no Z, but wait, parseISO '2023-10-15' returns Oct 15 at 00:00:00 local time
    // format using 'MMM d, yyyy' will yield 'Oct 15, 2023'
    expect(formatDateRange('2023-10-15', '2023-10-15')).toBe('Oct 15, 2023');
  });

  it('should return a range string if start and end dates are different', () => {
    expect(formatDateRange('2023-10-12', '2023-10-15')).toBe('Oct 12, 2023 - Oct 15, 2023');
  });

  it('should support custom date-fns format patterns', () => {
    expect(formatDateRange('2023-10-12', '2023-10-15', 'yyyy-MM-dd')).toBe('2023-10-12 - 2023-10-15');
    expect(formatDateRange('2023-10-15', '2023-10-15', 'yyyy-MM-dd')).toBe('2023-10-15');
  });
});
