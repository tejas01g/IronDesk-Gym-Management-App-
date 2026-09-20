/**
 * Formats rupee numbers with standard Indian formatting (lakhs/thousands)
 * e.g. 38400 -> "₹38,400" or "Rs 38,400"
 */
export function formatINR(amount: number = 0, prefix: string = '₹'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${prefix}0`;
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return `${prefix}${formatted}`;
}

export function formatINRWithRs(amount: number = 0): string {
  return formatINR(amount, 'Rs ');
}
