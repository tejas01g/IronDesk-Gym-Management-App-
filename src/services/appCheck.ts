import appCheck from '@react-native-firebase/app-check';

/**
 * Initializes Firebase App Check.
 *
 * - Development (__DEV__): Uses the debug provider so the real Play Integrity
 *   check is bypassed locally. Firebase will auto-generate a debug token and
 *   print it to the Metro/logcat console as:
 *     "[Firebase/AppCheck] App Check debug token: <TOKEN>"
 *   Copy that token and register it in:
 *     Firebase Console → App Check → Apps → IronDesk (Android) → Manage debug tokens
 *
 * - Production: Uses Play Integrity, which runs entirely silently — no
 *   reCAPTCHA screen will ever be shown to the user.
 *
 * NOTE: After setting this up, go to Firebase Console → App Check → Apps
 * and register each service (Auth, Firestore) for enforcement when ready.
 */
export async function initializeAppCheck(): Promise<void> {
  try {
    const provider = appCheck().newReactNativeFirebaseAppCheckProvider();
    provider.configure({
      android: {
        provider: __DEV__ ? 'debug' : 'playIntegrity',
      },
    });

    await appCheck().initializeAppCheck({
      provider,
      isTokenAutoRefreshEnabled: true,
    });

    console.log('[AppCheck] Initialized successfully');
  } catch (error) {
    // App Check init failure should not crash the app — Firebase will still
    // work but may fall back to reCAPTCHA for phone auth in production.
    console.warn('[AppCheck] Initialization failed:', error);
  }
}
