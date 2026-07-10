export const getCurrentMonthYear = () => {
  const today = new Date();
  const m = today.toLocaleString('default', { month: 'short' });
  const y = today.getFullYear();
  return `${m} ${y}`;
};
