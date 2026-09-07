import { MONTHS_3 } from './monthConstants.js';

export const getCurrentMonthYear = () => {
  const today = new Date();
  const m = MONTHS_3[today.getMonth()];
  const y = today.getFullYear();
  return `${m} ${y}`;
};
