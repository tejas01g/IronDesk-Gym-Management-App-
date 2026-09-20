import { auth, FirebaseAuthTypes } from './firebase';

export async function sendPhoneOtp(
  rawPhone: string
): Promise<FirebaseAuthTypes.ConfirmationResult> {
  const digits = rawPhone.replace(/\D/g, '');
  const formattedPhone = digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
  return await auth().signInWithPhoneNumber(formattedPhone);
}

export async function confirmOtpCode(
  confirmation: FirebaseAuthTypes.ConfirmationResult,
  code: string
): Promise<FirebaseAuthTypes.UserCredential | null> {
  return await confirmation.confirm(code);
}

export async function signOutUser(): Promise<void> {
  await auth().signOut();
}

export function getCurrentUser(): FirebaseAuthTypes.User | null {
  return auth().currentUser;
}

export function subscribeToAuthState(
  callback: (user: FirebaseAuthTypes.User | null) => void
): () => void {
  return auth().onAuthStateChanged(callback);
}
