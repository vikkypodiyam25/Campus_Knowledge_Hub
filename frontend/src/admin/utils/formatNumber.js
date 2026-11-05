/**
 * Formats a number with comma separators (e.g. 12,450)
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-US');
};

/**
 * Compact number formatting (e.g., 1.2k, 3.4M)
 */
export const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
};

/**
 * Formats percentage
 */
export const formatPercentage = (num) => {
  if (num === null || num === undefined) return '0%';
  const val = Number(num);
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
};
