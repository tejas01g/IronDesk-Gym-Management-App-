import { Linking } from 'react-native';

export interface UpiParams {
  upiId: string;
  name: string;
  amount: number;
  note?: string;
}

/**
 * Validates UPI format like username@bank, 9876543210@paytm, etc.
 */
export function isValidUpiId(upiId: string): boolean {
  if (!upiId) return false;
  // Standard format: [alpha-numeric-special]@[bank/provider]
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId.trim());
}

/**
 * Generates standard UPI payment URL
 */
export function generateUpiUrl({ upiId, name, amount, note = 'Gym Membership' }: UpiParams): string {
  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(name.trim());
  const cleanNote = encodeURIComponent(note.trim());
  const cleanAmount = Math.round(amount);

  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}

/**
 * Deep-links into any available UPI application (Google Pay, PhonePe, Paytm, BHIM)
 */
export async function openUpiPayment(upiUrl: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(upiUrl);
    if (supported) {
      await Linking.openURL(upiUrl);
      return true;
    } else {
      // Direct attempt in case canOpenURL reports false on some Android versions
      await Linking.openURL(upiUrl);
      return true;
    }
  } catch (error) {
    console.warn('[UPI] Could not launch UPI app:', error);
    return false;
  }
}
