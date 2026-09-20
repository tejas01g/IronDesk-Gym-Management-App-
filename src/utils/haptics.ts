import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const haptic = {
  light: () => {
    try {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    } catch {}
  },
  medium: () => {
    try {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    } catch {}
  },
  heavy: () => {
    try {
      ReactNativeHapticFeedback.trigger('impactHeavy', options);
    } catch {}
  },
  success: () => {
    try {
      ReactNativeHapticFeedback.trigger('notificationSuccess', options);
    } catch {}
  },
  warning: () => {
    try {
      ReactNativeHapticFeedback.trigger('notificationWarning', options);
    } catch {}
  },
  error: () => {
    try {
      ReactNativeHapticFeedback.trigger('notificationError', options);
    } catch {}
  },
};
