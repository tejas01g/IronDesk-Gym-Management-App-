import { isValidUpiId } from './upi';

export function isValidIndianPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  // Exactly 10 digits starting with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(digits);
}

export function isValidName(name: string): boolean {
  if (!name) return false;
  return name.trim().length >= 2;
}

export function isValidAmount(amount: number | string): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
}

export function isValidUtr(utr: string): boolean {
  if (!utr) return false;
  const clean = utr.trim();
  // UTR/UPI reference IDs are typically 12 digits or alphanumeric of length 8 to 22
  return clean.length >= 8 && /^[a-zA-Z0-9]+$/.test(clean);
}

export { isValidUpiId };
