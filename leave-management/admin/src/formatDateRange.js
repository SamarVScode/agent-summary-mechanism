// fallow-ignore-file
import { format, parseISO } from 'date-fns';

export function formatDateRange(startDate, endDate, pattern = 'MMM d, yyyy') {
  if (!startDate || !endDate) return '';
  return startDate === endDate 
    ? format(parseISO(startDate), pattern)
    : `${format(parseISO(startDate), pattern)} - ${format(parseISO(endDate), pattern)}`;
}
