import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Ensure offline persistence is enabled
try {
  firestore().settings({
    persistence: true,
    cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
  });
} catch (e) {
  // Settings may only be set before any other Firestore operations
  console.log('[Firestore] Settings already initialized or active');
}

export { auth, firestore };
export type { FirebaseAuthTypes, FirebaseFirestoreTypes };
