import { formatDate } from './formatDate';

export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  return startDate === endDate 
    ? formatDate(startDate)
    : `${formatDate(startDate)} - ${formatDate(endDate)}`;
};
